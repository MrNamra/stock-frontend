export const calculateTargetPrice = (buyPrice) => {
    const brokerCommission = 0.0097; // 0.97%
    const profitMargin = 0.0101; // 1.01%
    
    return (buyPrice * (1 + profitMargin)) / (1 - brokerCommission);
  };
  
  export const isPriceAboveYesterday = (currentPrice, previousClose) => {
    return currentPrice > previousClose;
  };