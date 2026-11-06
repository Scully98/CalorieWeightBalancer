import WidgetKit

struct BalanceEntry: TimelineEntry {
  let date: Date
  // nil: no file yet (app never opened, intro open, no App Group, restored
  // backup) or an unknown version.
  let snapshot: WidgetSnapshot?
  let isStale: Bool
}

// The widget computes nothing: new numbers only come with a reload from the
// app. The one change over time is the „Stand …“ line after midnight.
struct BalanceProvider: TimelineProvider {
  func placeholder(in context: Context) -> BalanceEntry {
    BalanceEntry(date: Date(), snapshot: .sample, isStale: false)
  }

  func getSnapshot(in context: Context, completion: @escaping (BalanceEntry) -> Void) {
    let now = Date()
    // The widget gallery shows the sample until the app wrote real numbers.
    let snapshot = WidgetSnapshot.load() ?? (context.isPreview ? .sample : nil)
    completion(
      BalanceEntry(date: now, snapshot: snapshot, isStale: snapshot?.isStale(at: now) ?? false))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<BalanceEntry>) -> Void) {
    let now = Date()
    guard let snapshot = WidgetSnapshot.load() else {
      completion(Timeline(entries: [BalanceEntry(date: now, snapshot: nil, isStale: false)], policy: .never))
      return
    }
    var entries = [BalanceEntry(date: now, snapshot: snapshot, isStale: snapshot.isStale(at: now))]
    if let staleAfter = snapshot.staleAfter, staleAfter > now {
      entries.append(BalanceEntry(date: staleAfter, snapshot: snapshot, isStale: true))
    }
    completion(Timeline(entries: entries, policy: .never))
  }
}
