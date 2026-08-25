<?php

namespace App\Modules\Inventory\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;

class PrintController extends Controller
{
    public function printLabel(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'code' => 'required|string',
            'format' => 'required|in:qr,barcode',
        ]);

        $name = $request->input('name');
        $code = $request->input('code');
        $format = $request->input('format');

        $printerName = "POS-58"; // Impresora local
        $tempFile = tempnam(sys_get_temp_dir(), 'escpos');

        \Log::info("INICIO IMPRESION $printerName");
        \Log::info("Impresora: $printerName");

        try {
            // Generar el archivo binario ESC/POS real utilizando FilePrintConnector
            $connector = new FilePrintConnector($tempFile);
            // Usar el perfil por defecto para que soporte QR, pero mantenemos CODE39 para el código de barras
            $printer = new Printer($connector);
            
            // Inicializar impresora para limpiar buffers colgados
            $printer->initialize();

            // Alinear todo al extremo derecho de la etiqueta
            $printer->setJustification(Printer::JUSTIFY_RIGHT);

            // 1. Línea superior: "Nombre - Código" en fuente pequeña alineada a la derecha
            $printer->selectPrintMode(Printer::MODE_FONT_B);
            $headerLine = substr($name, 0, 16) . " - " . $code;
            $printer->text($headerLine . "\n");
            $printer->selectPrintMode();

            // 2. Código QR o Barras abajo, alineado al extremo derecho
            $printer->setJustification(Printer::JUSTIFY_RIGHT);

            if ($format === 'qr') {
                try {
                    // Tamaño 5 alineado a la derecha
                    $printer->qrCode($code, Printer::QR_ECLEVEL_M, 5, Printer::QR_MODEL_2);
                } catch (\Exception $e) {
                    $printer->text("QR no soportado\n");
                }
            } else {
                $printer->setBarcodeHeight(36); 
                $printer->setBarcodeWidth(1);   
                try {
                    $printer->barcode($code, Printer::BARCODE_CODE39);
                } catch (\Exception $e) {
                    $printer->text("Cod. Barras no soportado\n");
                }
            }

            // Restaurar modo y corte exacto sin avance excesivo para no pisar la siguiente etiqueta
            $printer->selectPrintMode();
            $printer->feed(1);
            
            // Obligar a la impresora a procesar el final del documento (muy importante para POS-58)
            $printer->cut();
            $printer->pulse(); // Opcional, pero suele forzar el volcado del buffer
            
            // Obligar a la impresora a procesar el final del documento (muy importante para POS-58)
            $printer->cut();
            $printer->pulse(); // Opcional, pero suele forzar el volcado del buffer
            
            // Cerrar conexión para guardar los bytes
            $printer->close();
            \Log::info("Archivo binario cerrado...");

            // Verificar tamaño del trabajo
            $fileSize = filesize($tempFile);
            \Log::info("Trabajo ESC/POS generado: $fileSize bytes");

            // Ejecutar envío directo al Spooler vía script nativo PowerShell/C#
            \Log::info("Enviando trabajo crudo (RAW) vía API de Windows Spooler...");
            $scriptPath = storage_path('app/print_raw.ps1');
            $command = 'powershell.exe -NoProfile -NoLogo -NonInteractive -ExecutionPolicy Bypass -File ' . escapeshellarg($scriptPath) . ' -PrinterName ' . escapeshellarg($printerName) . ' -FileName ' . escapeshellarg($tempFile);
            
            exec($command, $output, $returnVar);

            @unlink($tempFile);

            if ($returnVar !== 0) {
                throw new \Exception("Error en spooler API: " . implode(" ", $output));
            }

            \Log::info("Trabajo inyectado con éxito en el Spooler de Windows.");

            return response()->json([
                'success' => true,
                'status' => 'success',
                'message' => 'Trabajo enviado a POS-58'
            ]);
        } catch (\Throwable $e) {
            \Log::error("ERROR IMPRESION $printerName");
            \Log::error("Mensaje: " . $e->getMessage());
            \Log::error("Archivo: " . $e->getFile());
            \Log::error("Linea: " . $e->getLine());
            
            if (isset($tempFile) && file_exists($tempFile)) {
                @unlink($tempFile);
            }

            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Error al enviar trabajo: ' . $e->getMessage()
            ], 500);
        }
    }
}
