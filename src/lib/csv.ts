/** Build RFC 4180 CSV, quoting every cell and neutralising spreadsheet formula injection. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          let v = cell == null ? "" : String(cell)
          if (/^[=+\-@]/.test(v)) v = `'${v}`
          return `"${v.replace(/"/g, '""')}"`
        })
        .join(","),
    )
    .join("\r\n")
}
