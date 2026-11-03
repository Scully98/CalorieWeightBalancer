import SwiftUI
import WidgetKit

// The balance of the period chosen in the app: small on the home screen,
// rectangular and inline on the lock screen.
struct BalanceWidget: Widget {
  let kind = "BalanceWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: BalanceProvider()) { entry in
      BalanceEntryView(entry: entry)
    }
    .configurationDisplayName("widget.name")
    .description("widget.description")
    .supportedFamilies([.systemSmall, .accessoryRectangular, .accessoryInline])
  }
}

struct BalanceEntryView: View {
  @Environment(\.widgetFamily) private var family
  let entry: BalanceEntry

  var body: some View {
    content
      // Opens the balance page.
      .widgetURL(URL(string: "calorieweightbalancer:///"))
      .widgetBackground(family == .systemSmall ? Palette.background : .clear)
  }

  @ViewBuilder private var content: some View {
    switch (family, entry.snapshot) {
    case (.accessoryInline, let snapshot?):
      InlineView(snapshot: snapshot)
    case (.accessoryInline, nil):
      Text("placeholder.inline")
    case (.accessoryRectangular, let snapshot?):
      RectangularView(snapshot: snapshot, isStale: entry.isStale)
    case (.accessoryRectangular, nil):
      PlaceholderView(compact: true)
    case (_, let snapshot?):
      SmallView(snapshot: snapshot, isStale: entry.isStale)
    case (_, nil):
      PlaceholderView(compact: false)
    }
  }
}

enum Palette {
  static let background = Color("$widgetBackground")
  static let foreground = Color("foreground")
  static let muted = Color("muted")
}

extension View {
  // Required from iOS 17 on, otherwise iOS shows "Please adopt
  // containerBackground API"; before that the widget has no margins of its own.
  @ViewBuilder func widgetBackground(_ color: Color) -> some View {
    if #available(iOS 17.0, *) {
      containerBackground(for: .widget) { color }
    } else {
      padding().background(color)
    }
  }
}
