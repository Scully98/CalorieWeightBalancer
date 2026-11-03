import SwiftUI
import WidgetKit

extension WidgetSnapshot {
  // Golden test case without tolerance, for the widget gallery placeholder
  // and the previews. Same texts as src/features/widget/__fixtures__/snapshot-golden.json.
  static let sample = decode(Data(sampleJSON(range: nil, fat: "ca. +0,9 kg Körperfett").utf8))!

  static func sampleJSON(range: String?, fat: String, kind: String = "balance") -> String {
    let rangeJSON = range.map { "\"\($0)\"" } ?? "null"
    let content =
      kind == "balance"
      ? """
        {"kind":"balance","kcal":"+7.000","unit":"kcal","range":\(rangeJSON),"fat":"\(fat)","lockFat":"ca. +0,9 kg Fett","inline":"+7.000 kcal · 30 T","label":"30 Tage, 24. September bis 23. Oktober. plus 7.000 Kilokalorien, mehr gegessen als verbraucht. etwa plus 0,9 Kilogramm Körperfett, berechnet","lockLabel":"30 Tage. plus 7.000 Kilokalorien, mehr gegessen als verbraucht. etwa plus 0,9 Kilogramm Körperfett, berechnet"}
        """
      : """
        {"kind":"empty","message":"Keine Nahrung in diesem Zeitraum.","inline":"Bilanz: noch keine Daten","label":"30 Tage, 24. September bis 23. Oktober. Keine Nahrung in diesem Zeitraum."}
        """
    return """
      {"version":1,"loadedAt":"2026-10-24T06:14:00.000Z","staleAfter":"2026-10-24T22:00:00.000Z","title":"30 Tage","dates":"24. Sep – 23. Okt","stale":"Stand 24. Okt, 08:14","staleLabel":"Stand 24. Oktober, 08:14 Uhr","content":\(content)}
      """
  }
}

#if DEBUG
  struct BalanceWidget_Previews: PreviewProvider {
    static let withRange = WidgetSnapshot.decode(
      Data(
        WidgetSnapshot.sampleJSON(
          range: "+2.650 bis +19.350", fat: "ca. +0,3 bis +2,5 kg Körperfett"
        ).utf8))!
    static let empty = WidgetSnapshot.decode(
      Data(WidgetSnapshot.sampleJSON(range: nil, fat: "", kind: "empty").utf8))!

    static func entry(_ snapshot: WidgetSnapshot?, stale: Bool = false) -> BalanceEntry {
      BalanceEntry(date: Date(), snapshot: snapshot, isStale: stale)
    }

    static var previews: some View {
      Group {
        BalanceEntryView(entry: entry(.sample))
          .previewContext(WidgetPreviewContext(family: .systemSmall))
          .previewDisplayName("Einzelwert")
        BalanceEntryView(entry: entry(withRange))
          .previewContext(WidgetPreviewContext(family: .systemSmall))
          .previewDisplayName("Toleranz")
        BalanceEntryView(entry: entry(.sample, stale: true))
          .previewContext(WidgetPreviewContext(family: .systemSmall))
          .previewDisplayName("Stand alt")
        BalanceEntryView(entry: entry(empty))
          .previewContext(WidgetPreviewContext(family: .systemSmall))
          .previewDisplayName("Leer")
        BalanceEntryView(entry: entry(nil))
          .previewContext(WidgetPreviewContext(family: .systemSmall))
          .previewDisplayName("Platzhalter")
        BalanceEntryView(entry: entry(.sample))
          .previewContext(WidgetPreviewContext(family: .systemSmall))
          .environment(\.colorScheme, .dark)
          .previewDisplayName("Dunkel")
        BalanceEntryView(entry: entry(.sample, stale: true))
          .previewContext(WidgetPreviewContext(family: .accessoryRectangular))
          .previewDisplayName("Sperrbildschirm")
        BalanceEntryView(entry: entry(.sample))
          .previewContext(WidgetPreviewContext(family: .accessoryInline))
          .previewDisplayName("Inline")
      }
    }
  }
#endif
