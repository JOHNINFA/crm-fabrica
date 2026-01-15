using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Runtime.InteropServices;
using System.Drawing.Printing;

namespace CajonServer
{
    class Program
    {
        private static int PUERTO = 3001;
        private static string nombreImpresora = "";
        
        // Múltiples comandos ESC/POS para probar
        private static byte[][] COMANDOS = new byte[][] {
            new byte[] { 0x1B, 0x70, 0x00, 0x32, 0xFA },  // Pin 2 (Caja #1), 50ms
            new byte[] { 0x1B, 0x70, 0x01, 0x32, 0xFA },  // Pin 5 (Caja #2), 50ms
            new byte[] { 0x1B, 0x70, 0x00, 0x64, 0xFA },  // Pin 2, 100ms
            new byte[] { 0x1B, 0x70, 0x01, 0x64, 0xFA },  // Pin 5, 100ms
            new byte[] { 0x10, 0x14, 0x01, 0x00, 0x05 },  // Comando alternativo
        };

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
        public class DOCINFOA
        {
            [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
            [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
            [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
        }

        [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
        public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

        [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true)]
        public static extern bool ClosePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
        public static extern bool StartDocPrinter(IntPtr hPrinter, int level, DOCINFOA di);

        [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
        public static extern bool EndDocPrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
        public static extern bool StartPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
        public static extern bool EndPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true)]
        public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

        static void Main(string[] args)
        {
            Console.WriteLine("========================================");
            Console.WriteLine("  SERVIDOR CAJON MONEDERO v2.0");
            Console.WriteLine("  Puerto: " + PUERTO);
            Console.WriteLine("  Prueba TODOS los comandos ESC/POS");
            Console.WriteLine("========================================");

            if (args.Length == 0)
            {
                Console.WriteLine("ERROR: Falta nombre de impresora");
                Console.WriteLine("Uso: CajonServer.exe \"Nombre de Impresora\"");
                Console.WriteLine("Impresoras disponibles:");
                foreach (string p in PrinterSettings.InstalledPrinters)
                {
                    Console.WriteLine("  - " + p);
                }
                Console.WriteLine("Presiona cualquier tecla para salir...");
                Console.ReadKey();
                return;
            }

            nombreImpresora = args[0];
            Console.WriteLine("Impresora: " + nombreImpresora);
            IniciarServidor();
        }

        static void IniciarServidor()
        {
            HttpListener listener = new HttpListener();
            listener.Prefixes.Add("http://127.0.0.1:" + PUERTO + "/");
            listener.Prefixes.Add("http://localhost:" + PUERTO + "/");

            try
            {
                listener.Start();
                Console.WriteLine("Servidor iniciado en http://127.0.0.1:" + PUERTO);
                Console.WriteLine("Endpoints: /open-drawer, /abrir-cajon, /health");
                Console.WriteLine("Presiona Ctrl+C para detener...");
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR: " + ex.Message);
                Console.ReadKey();
                return;
            }

            while (true)
            {
                try
                {
                    HttpListenerContext context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem(ProcesarRequest, context);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error: " + ex.Message);
                }
            }
        }

        static void ProcesarRequest(object state)
        {
            HttpListenerContext context = (HttpListenerContext)state;
            HttpListenerRequest request = context.Request;
            HttpListenerResponse response = context.Response;

            response.Headers.Add("Access-Control-Allow-Origin", "*");
            response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");

            string path = request.Url.AbsolutePath.ToLower();
            string responseString = "";

            Console.WriteLine("[" + DateTime.Now.ToString("HH:mm:ss") + "] " + request.HttpMethod + " " + path);

            if (request.HttpMethod == "OPTIONS")
            {
                response.StatusCode = 200;
                response.Close();
                return;
            }

            if (path == "/status" || path == "/" || path == "/health")
            {
                responseString = "{\"status\": \"ok\", \"impresora\": \"" + nombreImpresora + "\"}";
            }
            else if (path == "/abrir-cajon" || path == "/open-drawer")
            {
                bool exito = AbrirCajonTodosComandos();
                if (exito)
                {
                    responseString = "{\"success\": true, \"message\": \"Cajon abierto\"}";
                }
                else
                {
                    responseString = "{\"success\": false, \"error\": \"No se pudo abrir\"}";
                }
            }
            else
            {
                response.StatusCode = 404;
                responseString = "{\"error\": \"No encontrado: " + path + "\"}";
            }

            byte[] buffer = Encoding.UTF8.GetBytes(responseString);
            response.ContentType = "application/json";
            response.ContentLength64 = buffer.Length;
            response.OutputStream.Write(buffer, 0, buffer.Length);
            response.Close();
        }

        static bool AbrirCajonTodosComandos()
        {
            Console.WriteLine("  Probando TODOS los comandos...");
            
            for (int i = 0; i < COMANDOS.Length; i++)
            {
                byte[] cmd = COMANDOS[i];
                string hexCmd = BitConverter.ToString(cmd).Replace("-", " ");
                Console.WriteLine("  [" + (i+1) + "/" + COMANDOS.Length + "] Comando: " + hexCmd);
                
                bool ok = EnviarComando(cmd);
                if (ok)
                {
                    Console.WriteLine("  -> Enviado OK");
                }
                else
                {
                    Console.WriteLine("  -> Error");
                }
                
                Thread.Sleep(200); // Esperar entre comandos
            }
            
            Console.WriteLine("  -> TODOS los comandos enviados");
            return true;
        }

        static bool EnviarComando(byte[] comando)
        {
            IntPtr hPrinter = IntPtr.Zero;
            DOCINFOA doc = new DOCINFOA();
            doc.pDocName = "CajonMonedero";
            doc.pDataType = "RAW";

            try
            {
                if (!OpenPrinter(nombreImpresora, out hPrinter, IntPtr.Zero))
                    return false;

                if (!StartDocPrinter(hPrinter, 1, doc))
                {
                    ClosePrinter(hPrinter);
                    return false;
                }

                if (!StartPagePrinter(hPrinter))
                {
                    EndDocPrinter(hPrinter);
                    ClosePrinter(hPrinter);
                    return false;
                }

                IntPtr ptrBytes = Marshal.AllocCoTaskMem(comando.Length);
                Marshal.Copy(comando, 0, ptrBytes, comando.Length);

                int escritos = 0;
                bool ok = WritePrinter(hPrinter, ptrBytes, comando.Length, out escritos);

                Marshal.FreeCoTaskMem(ptrBytes);
                EndPagePrinter(hPrinter);
                EndDocPrinter(hPrinter);
                ClosePrinter(hPrinter);

                return ok;
            }
            catch
            {
                return false;
            }
        }
    }
}
