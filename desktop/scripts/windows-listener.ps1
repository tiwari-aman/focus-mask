# Windows Native Foreground Window Hook (0ms latency via SetWinEventHook)
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Diagnostics;

public class NativeHook {
    public delegate void WinEventDelegate(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime);

    [DllImport("user32.dll")]
    public static extern IntPtr SetWinEventHook(uint eventMin, uint eventMax, IntPtr hmodWinEventProc, WinEventDelegate lpfnWinEventProc, uint idProcess, uint idThread, uint dwFlags);

    [DllImport("user32.dll")]
    public static extern bool UnhookWinEvent(IntPtr hWinEventHook);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public static void EmitCurrent() {
        IntPtr hwnd = GetForegroundWindow();
        if (hwnd == IntPtr.Zero) return;
        uint pid;
        GetWindowThreadProcessId(hwnd, out pid);
        try {
            Process proc = Process.GetProcessById((int)pid);
            string name = proc.ProcessName;
            if (name == "electron" || name == "focusmask-desktop") return;
            RECT rect;
            GetWindowRect(hwnd, out rect);
            int x = rect.Left;
            int y = rect.Top;
            int w = rect.Right - rect.Left;
            int h = rect.Bottom - rect.Top;
            Console.WriteLine(string.Format("{{\"appName\":\"{0}\",\"pid\":{1},\"bounds\":{{\"x\":{2},\"y\":{3},\"width\":{4},\"height\":{5}}}}}", name, pid, x, y, w, h));
        } catch {}
    }
}
"@

[NativeHook]::EmitCurrent()

$delegate = [NativeHook+WinEventDelegate]{
    param($hook, $event, $hwnd, $idObj, $idChild, $thread, $time)
    [NativeHook]::EmitCurrent()
}

# EVENT_SYSTEM_FOREGROUND = 0x0003
$hook = [NativeHook]::SetWinEventHook(0x0003, 0x0003, [IntPtr]::Zero, $delegate, 0, 0, 0)

[System.Windows.Forms.Application]::Run()
