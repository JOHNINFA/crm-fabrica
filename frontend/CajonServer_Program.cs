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
        
        // COMANDO REAL-TIME (Funciona incluso SIN PAPEL o en ERROR)
        // DLE DC4 fn=1 pulse
        private static byte[][] COMANDOS = new byte[][] {
            new byte[] { 0x10, 0x14, 0x01, 0x00, 0x05 }, 
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
            Console.WriteLine("  SERVIDOR CAJON MONEDERO v4.0 (UNIVERSAL)");
            Console.WriteLine("  Puerto: " + PUERTO);
            Console.WriteLine("========================================");

            if (args.Length > 0)
            {
                nombreImpresora = args[0];
            }
            else
            {
                Console.WriteLine("[-] Buscando impresora EPSON / TM... ");
                foreach (string p in PrinterSettings.InstalledPrinters)
                {
                    if (p.ToUpper().Contains("EPSON") || p.ToUpper().Contains("TM-"))
                    {
                        nombreImpresora = p;
                        Console.WriteLine("ENCONTRADA: " + nombreImpresora);
                        break;
                    }
                }
                
                if (nombreImpresora == "")
                {
                    Console.WriteLine("ERROR: No encontre ninguna impresora EPSON o TM-");
                    Console.WriteLine("Por favor pasa el nombre como argumento.");
                    Console.ReadKey();
                    return;
                }
            }

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
                Console.WriteLine("LISTO PARA ABRIR EL CAJON!");
                Console.WriteLine("Presiona Ctrl+C para detener...");
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR AL INICIAR SERVIDOR: " + ex.Message);
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
                    Console.WriteLine("Error Listener: " + ex.Message);
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

            if (request.HttpMethod != "OPTIONS")
            {
                Console.WriteLine("[" + DateTime.Now.ToString("HH:mm:ss") + "] Solicitud recibida: " + path);
            }

            if (request.HttpMethod == "OPTIONS")
            {
                response.StatusCode = 200;
                response.Close();
                return;
            }

            if (path == "/status" || path == "/" || path == "/health")
            {
                responseString = "{\"status\": \"ok\", \"impresora\": \"" + nombreImpresora + "\", \"mode\": \"UNIVERSAL\"}";
            }
            else if (path == "/abrir-cajon" || path == "/open-drawer")
            {
                // Intentar enviar ráfaga de comandos
                bool algunaFunciono = false;
                
                foreach(byte[] cmd in COMANDOS) {
                    if (EnviarComando(cmd)) algunaFunciono = true;
                    // Pequeña pausa entre comandos para no saturar
                    Thread.Sleep(30); 
                }

                if (algunaFunciono)
                {
                    responseString = "{\"success\": true, \"message\": \"Comandos enviados\"}";
                    Console.WriteLine("  -> EXITO: Al menos un comando fue enviado correctamente");
                }
                else
                {
                    responseString = "{\"success\": false, \"error\": \"Fallo al enviar a impresora\"}";
                    Console.WriteLine("  -> FALLO TOTAL: Ningun comando pudo ser enviado");
                }
            }
            else
            {
                response.StatusCode = 404;
                responseString = "{\"error\": \"No encontrado\"}";
            }

            byte[] buffer = Encoding.UTF8.GetBytes(responseString);
            response.ContentType = "application/json";
            response.ContentLength64 = buffer.Length;
            try {
                response.OutputStream.Write(buffer, 0, buffer.Length);
                response.Close();
            } catch {}
        }

        static bool EnviarComando(byte[] comando)
        {
            IntPtr hPrinter = IntPtr.Zero;
            DOCINFOA doc = new DOCINFOA();
            doc.pDocName = "CajonMonedero";
            doc.pDataType = "RAW";

            try
            {
                if (!OpenPrinter(nombreImpresora, out hPrinter, IntPtr.Zero)) {
                    int err = Marshal.GetLastWin32Error();
                    // Solo imprimimos error si es critico o para debugging
                    // Console.WriteLine("     [x] Error OpenPrinter: " + err);
                    return false;
                }

                if (!StartDocPrinter(hPrinter, 1, doc))
                {
                    int err = Marshal.GetLastWin32Error();
                    Console.WriteLine("     [x] Error StartDoc: " + err);
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
            catch (Exception ex)
            {
                Console.WriteLine("     [!] Excepcion: " + ex.Message);
                return false;
            }
        }
    }
}
