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

            // PRUEBA COMPLETA (Optimizado para 58mm)
            $printer->setJustification(Printer::JUSTIFY_CENTER);

            // Reducir tamaño de letra usando la Fuente B (más pequeña)
            $printer->selectPrintMode(Printer::MODE_FONT_B);

            // Cabecera compacta
            $printer->setEmphasis(true);
            $printer->text("VIVERO DE CACAO\n");
            $printer->setEmphasis(false);

            // Nombre de la entidad (recortado si es muy largo)
            $shortName = substr($name, 0, 24);
            $printer->text($shortName . "\n");
            
            // Restaurar a modo normal
            $printer->selectPrintMode();

            // Imprimir el formato solicitado
            if ($format === 'qr') {
                try {
                    // Tamaño 7 es aprox 30-35mm
                    $printer->qrCode($code, Printer::QR_ECLEVEL_M, 7, Printer::QR_MODEL_2);
                } catch (\Exception $e) {
                    $printer->text("QR no soportado\n");
                }
                $printer->text("\n");
            } else {
                // CODE39 es el más estándar para POS-58 baratos (sólo letras MAYUS y números)
                $printer->setBarcodeHeight(60); 
                $printer->setBarcodeWidth(2);   
                try {
                    $printer->barcode($code, Printer::BARCODE_CODE39);
                } catch (\Exception $e) {
                    $printer->text("Cod. Barras no soportado\n");
                }
                $printer->text("\n");
            }

            // Código abajo como pie, en fuente pequeña para que quepa bien
            $printer->selectPrintMode(Printer::MODE_FONT_B);
            $printer->text($code . "\n");
            
            // Restaurar modo normal
            $printer->selectPrintMode();
            
            // Alimentar y cortar (si lo soporta)
            $printer->feed(3);
            
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
