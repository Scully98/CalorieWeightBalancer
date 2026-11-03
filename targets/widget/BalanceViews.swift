import SwiftUI
import WidgetKit

// Home screen, as in .claude/design/widget/small-1b.png: left-aligned title
// and dates, the balance large, „kcal“ below, then the fat equivalent.
struct SmallView: View {
  let snapshot: WidgetSnapshot
  let isStale: Bool
  @ScaledMetric(relativeTo: .largeTitle) private var kcalSize: CGFloat = 44

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      Text(snapshot.title)
        .font(.headline)
        .foregroundColor(Palette.foreground)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
      Text(snapshot.dates)
        .font(.subheadline)
        .foregroundColor(Palette.muted)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
      Spacer(minLength: 4)
      switch snapshot.content {
      case .balance(let balance):
        Text(balance.kcal)
          .font(.system(size: kcalSize, weight: .medium))
          .monospacedDigit()
          .foregroundColor(Palette.foreground)
          .lineLimit(1)
          .minimumScaleFactor(0.4)
        Text(balance.unit)
          .font(.headline)
          .foregroundColor(Palette.foreground)
          .lineLimit(1)
        if let range = balance.range {
          Text(range)
            .font(.footnote)
            .foregroundColor(Palette.foreground)
            .lineLimit(1)
            .minimumScaleFactor(0.6)
        }
        Spacer(minLength: 4)
        Text(balance.fat)
          .font(.footnote)
          .foregroundColor(Palette.muted)
          .lineLimit(2)
          .minimumScaleFactor(0.7)
      case .empty(let empty):
        Text(empty.message)
          .font(.subheadline)
          .foregroundColor(Palette.foreground)
          .lineLimit(3)
          .minimumScaleFactor(0.7)
        Spacer(minLength: 0)
      }
      if isStale {
        Text(snapshot.stale)
          .font(.caption2)
          .foregroundColor(Palette.muted)
          .lineLimit(1)
          .minimumScaleFactor(0.6)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(snapshot.spokenLabel(isStale: isStale, lockScreen: false))
  }
}

// Lock screen below the clock: always the single value and fat, three lines.
struct RectangularView: View {
  let snapshot: WidgetSnapshot
  let isStale: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      (Text(snapshot.title).font(.headline)
        + Text(isStale ? " · \(snapshot.stale)" : "").font(.caption).foregroundColor(.secondary))
        .widgetAccentable()
        .lineLimit(1)
        .minimumScaleFactor(0.6)
      switch snapshot.content {
      case .balance(let balance):
        Text("\(balance.kcal) \(balance.unit)")
          .font(.title3.weight(.semibold))
          .monospacedDigit()
          .lineLimit(1)
          .minimumScaleFactor(0.6)
        Text(balance.lockFat)
          .font(.caption)
          .foregroundColor(.secondary)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      case .empty(let empty):
        Text(empty.message)
          .font(.caption)
          .lineLimit(2)
          .minimumScaleFactor(0.7)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(snapshot.spokenLabel(isStale: isStale, lockScreen: true))
  }
}

// Lock screen above the clock: one line next to the date.
struct InlineView: View {
  let snapshot: WidgetSnapshot

  var body: some View {
    switch snapshot.content {
    case .balance(let balance):
      Text(balance.inline).accessibilityLabel(balance.lockLabel)
    case .empty(let empty):
      Text(empty.inline).accessibilityLabel(empty.label)
    }
  }
}

// No file from the app yet: the only texts the widget translates itself.
struct PlaceholderView: View {
  let compact: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: compact ? 0 : 6) {
      Text("placeholder.title")
        .font(.headline)
        .foregroundColor(compact ? nil : Palette.foreground)
      Text("placeholder.body")
        .font(compact ? .caption : .subheadline)
        .foregroundColor(compact ? .secondary : Palette.muted)
        .lineLimit(compact ? 2 : 4)
        .minimumScaleFactor(0.7)
      if !compact { Spacer(minLength: 0) }
    }
    .frame(
      maxWidth: .infinity, maxHeight: compact ? nil : .infinity, alignment: .topLeading
    )
    .accessibilityElement(children: .combine)
  }
}

extension WidgetSnapshot {
  // One VoiceOver label per widget, with „Stand …“ when it is shown.
  func spokenLabel(isStale: Bool, lockScreen: Bool) -> String {
    let label: String
    switch content {
    case .balance(let balance): label = lockScreen ? balance.lockLabel : balance.label
    case .empty(let empty): label = empty.label
    }
    return isStale ? "\(label). \(staleLabel)" : label
  }
}
