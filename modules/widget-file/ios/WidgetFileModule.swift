import ExpoModulesCore
import UIKit

// Files in the App Group container, shared with the widget extension. Their
// folder is excluded from backup, so derived Health values never reach iCloud
// (App Review Guideline 5.1.3). The protection class keeps them readable on the
// lock screen once the device was unlocked after a restart.
public class WidgetFileModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetFile")

    // false without the App Group entitlement (Personal Team builds).
    Function("write") { (group: String, path: String, contents: String) -> Bool in
      guard let url = Self.fileURL(group: group, path: path) else { return false }
      do {
        var folder = url.deletingLastPathComponent()
        try FileManager.default.createDirectory(
          at: folder, withIntermediateDirectories: true)
        // On the folder, not the file: an atomic write replaces the file and
        // would drop the flag.
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try folder.setResourceValues(values)
        try Data(contents.utf8).write(
          to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        return true
      } catch {
        return false
      }
    }

    Function("read") { (group: String, path: String) -> String? in
      guard let url = Self.fileURL(group: group, path: path),
        let data = try? Data(contentsOf: url)
      else { return nil }
      return String(data: data, encoding: .utf8)
    }

    Function("remove") { (group: String, path: String) in
      guard let url = Self.fileURL(group: group, path: path) else { return }
      try? FileManager.default.removeItem(at: url)
    }

    // false while the device is locked: HealthKit is encrypted then.
    AsyncFunction("isProtectedDataAvailable") { () -> Bool in
      UIApplication.shared.isProtectedDataAvailable
    }.runOnQueue(.main)
  }

  private static func fileURL(group: String, path: String) -> URL? {
    FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: group)?
      .appendingPathComponent(path)
  }
}
