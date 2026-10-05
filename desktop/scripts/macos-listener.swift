import Cocoa

func getFrontWindow(pid: pid_t) -> [String: Double]? {
    guard let windowList = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] else {
        return nil
    }
    for win in windowList {
        if let winPid = win[kCGWindowOwnerPID as String] as? pid_t, winPid == pid {
            if let bounds = win[kCGWindowBounds as String] as? [String: Any],
               let layer = win[kCGWindowLayer as String] as? Int, layer == 0 {
                let x = bounds["X"] as? Double ?? 0
                let y = bounds["Y"] as? Double ?? 0
                let w = bounds["Width"] as? Double ?? 0
                let h = bounds["Height"] as? Double ?? 0
                if w > 50 && h > 50 {
                    return ["x": x, "y": y, "width": w, "height": h]
                }
            }
        }
    }
    return nil
}

func emit(app: NSRunningApplication) {
    let name = app.localizedName ?? ""
    if name == "Electron" || name == "focusmask-desktop" { return }
    let pid = app.processIdentifier
    let b = getFrontWindow(pid: pid) ?? ["x": 0, "y": 0, "width": 1920, "height": 1080]
    let json = "{\"appName\":\"\(name)\",\"pid\":\(pid),\"bounds\":{\"x\":\(b["x"]!),\"y\":\(b["y"]!),\"width\":\(b["width"]!),\"height\":\(b["height"]!)}}\n"
    FileHandle.standardOutput.write(json.data(using: .utf8)!)
}

// Emit initial front app immediately
if let front = NSWorkspace.shared.frontmostApplication {
    emit(app: front)
}

// Observe native macOS app activation notifications (0ms latency)
let ws = NSWorkspace.shared
let nc = ws.notificationCenter
nc.addObserver(forName: NSWorkspace.didActivateApplicationNotification, object: nil, queue: .main) { notif in
    if let app = notif.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication {
        emit(app: app)
    }
}

CFRunLoopRun()
