export const getOrderCountComparison = (todayCount: number, yesterdayCount: number) => {
  if (yesterdayCount === 0) {
    return todayCount > 0 ? todayCount * 100 : 0;
  }
  const percentage = ((todayCount - yesterdayCount) / yesterdayCount) * 100
  return percentage;
};