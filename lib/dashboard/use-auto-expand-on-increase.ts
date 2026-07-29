import { useEffect, useRef } from "react";

/** Opens a collapsible section when a balance increases (e.g. new funds deposited). */
export function useAutoExpandOnIncrease(
  balance: number,
  setOpen: (open: boolean) => void,
) {
  const previousBalanceRef = useRef(balance);

  useEffect(() => {
    if (balance > previousBalanceRef.current && balance > 0) {
      setOpen(true);
    }
    previousBalanceRef.current = balance;
  }, [balance, setOpen]);
}
