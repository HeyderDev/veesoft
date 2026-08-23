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
            $connectorName = get_class($connector);
            \Log::info("Conector: $connectorName (Archivo temporal)");

            $printer = new Printer($connector);

            // PRUEBA COMPLETA: QR y CODE128 (Optimizado para 58mm)
            $printer->setJustification(Printer::JUSTIFY_CENTER);

            // Reducir tamaño de letra usando la Fuente B (más pequeña)
            $printer->selectPrintMode(Printer::MODE_FONT_B);

            // Cabecera
            $printer->setEmphasis(true);
            $printer->text("VIVERO DE CACAO\n\n");
            $printer->setEmphasis(false);

            // Nombre de la Herramienta
            $printer->text($name . "\n\n");
            
            // Ya no imprimimos el código arriba, solo abajo.

            // Imprimir el formato solicitado desde el frontend
            if ($format === 'qr') {
                // Generar código QR más grande (tamaño 8)
                $printer->qrCode($code, Printer::QR_ECLEVEL_M, 8, Printer::QR_MODEL_2);
                $printer->text("\n");
            } else {
                // Generar CODE128 más grande (altura 80, anchura 3)
                $printer->setBarcodeHeight(80); 
                $printer->setBarcodeWidth(3);   
                $printer->barcode('{B' . $code, Printer::BARCODE_CODE128);
                $printer->text("\n");
            }

            // Código abajo como pie
            $printer->text($code . "\n");
            
            // Restaurar modo normal
            $printer->selectPrintMode();
            
            // Alimentar algunas líneas antes de terminar
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
