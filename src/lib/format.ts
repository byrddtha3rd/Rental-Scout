export const money = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value || 0);

export const number = (value: number) =>
  new Intl.NumberFormat("en-US").format(value || 0);

export const percent = (value: number) => `${((value || 0) * 100).toFixed(2)}%`;

export const dateLabel = (value: string) =>
  value
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
        .format(new Date(`${value}T12:00:00`))
    : "Not scheduled";
