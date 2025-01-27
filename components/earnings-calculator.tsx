"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { IndianRupee, DollarSign, Euro, Settings, Download, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Currency {
  symbol: string;
  icon: React.ElementType;
  minAmount: number;
  maxAmount: number;
}

const currencies: Record<string, Currency> = {
  INR: { 
    symbol: "₹", 
    icon: IndianRupee, 
    minAmount: 1000, 
    maxAmount: 100000000 
  },
  USD: { 
    symbol: "$", 
    icon: DollarSign, 
    minAmount: 100, 
    maxAmount: 1000000 
  },
  EUR: { 
    symbol: "€", 
    icon: Euro, 
    minAmount: 100, 
    maxAmount: 1000000 
  },
};

interface Earnings {
  second: number;
  minute: number;
  hour: number;
  day: number;
  month: number;
  yearToDate: number;
  monthProgress: number;
  yearProgress: number;
  tillNow: number;
}

const INITIAL_SALARY = 300000;

export function EarningsCalculator() {
  const { toast } = useToast();
  const [salary, setSalary] = useState(() => {
    if (typeof window !== "undefined") {
      const savedSalary = Number(localStorage.getItem("salary")) || INITIAL_SALARY;
      return Math.max(savedSalary, currencies.INR.minAmount);
    }
    return INITIAL_SALARY;
  });

  const [isYearly, setIsYearly] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isYearly") === "true" || false;
    }
    return false;
  });

  const [currency, setCurrency] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currency") || "INR";
    }
    return "INR";
  });

  const [earnings, setEarnings] = useState<Earnings>({
    second: 0,
    minute: 0,
    hour: 0,
    day: 0,
    month: 0,
    yearToDate: 0,
    monthProgress: 0,
    yearProgress: 0,
    tillNow: 0,
  });

  const [error, setError] = useState<string | null>(null);

  const validateSalary = useCallback((amount: number, currencyCode: string) => {
    const currencyConfig = currencies[currencyCode];
    if (amount < currencyConfig.minAmount) {
      return `Minimum ${currencyConfig.symbol}${currencyConfig.minAmount.toLocaleString()}`;
    }
    if (amount > currencyConfig.maxAmount) {
      return `Maximum ${currencyConfig.symbol}${currencyConfig.maxAmount.toLocaleString()}`;
    }
    return null;
  }, []);

  const handleSalaryChange = useCallback((value: string) => {
    const numValue = Math.abs(Number(value)) || 0;
    const errorMessage = validateSalary(numValue, currency);
    setError(errorMessage);
    setSalary(numValue);
  }, [currency, validateSalary]);

  useEffect(() => {
    if (!error) {
      localStorage.setItem("salary", salary.toString());
      localStorage.setItem("isYearly", isYearly.toString());
      localStorage.setItem("currency", currency);
    }
  }, [salary, isYearly, currency, error]);

  const calculateEarnings = useCallback(() => {
    if (error) return null;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    
    const yearlyAmount = isYearly ? salary : salary * 12;
    const monthlyAmount = yearlyAmount / 12;
    const dailyAmount = monthlyAmount / daysInMonth;
    const hourlyAmount = dailyAmount / 24;
    const minuteAmount = hourlyAmount / 60;
    const secondAmount = minuteAmount / 60;

    const dayOfMonth = now.getDate();
    const monthProgress = (dayOfMonth / daysInMonth) * 100;

    const dayOfYear = Math.floor(
      (now - startOfYear) / (1000 * 60 * 60 * 24)
    );
    const yearProgress = (dayOfYear / 365) * 100;

    const fullDaysEarned = (dayOfMonth - 1) * dailyAmount;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    
    const partialDayEarned = 
      (currentHour * hourlyAmount) +
      (currentMinute * minuteAmount) +
      (currentSecond * secondAmount);

    const tillNowAmount = fullDaysEarned + partialDayEarned;
    const earnedThisYear = (yearlyAmount * dayOfYear) / 365;

    return {
      second: secondAmount,
      minute: minuteAmount,
      hour: hourlyAmount,
      day: dailyAmount,
      month: monthlyAmount,
      yearToDate: earnedThisYear,
      monthProgress,
      yearProgress,
      tillNow: tillNowAmount,
    };
  }, [salary, isYearly, error]);

  useEffect(() => {
    const updateEarnings = () => {
      const newEarnings = calculateEarnings();
      if (newEarnings) {
        setEarnings(newEarnings);
      }
    };

    updateEarnings();
    const interval = setInterval(updateEarnings, 1000);
    return () => clearInterval(interval);
  }, [calculateEarnings]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Math.max(0, amount));
  }, [currency]);

  const handleExport = useCallback(() => {
    if (error) return;

    const data = Object.entries(earnings)
      .map(([key, value]) => `${key},${value}`)
      .join("\n");
    const blob = new Blob([`metric,amount\n${data}`], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "earnings-breakdown.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: "Your earnings breakdown has been downloaded.",
    });
  }, [earnings, error, toast]);

  const handleReset = useCallback(() => {
    setSalary(INITIAL_SALARY);
    setIsYearly(false);
    setCurrency("INR");
    setError(null);
    toast({
      title: "Settings reset",
      description: "Your preferences have been reset to default values.",
    });
  }, [toast]);

  const CurrencyIcon = currencies[currency].icon;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold tracking-tight">
            Real-Time Earnings Calculator
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your earnings down to the second!
          </p>
        </div>
        <ThemeToggle />
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label>
                {isYearly ? "Yearly" : "Monthly"} Salary
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <CurrencyIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={salary}
                    onChange={(e) => handleSalaryChange(e.target.value)}
                    className={`pl-10 ${error ? 'border-destructive' : ''}`}
                    min={currencies[currency].minAmount}
                    max={currencies[currency].maxAmount}
                  />
                </div>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <Label>Show yearly salary</Label>
            </div>
          </div>
        </div>

        {!error && (
          <>
            <Card className="p-4 space-y-2 bg-primary/5">
              <p className="text-sm text-muted-foreground">Earned This Month (Till Now)</p>
              <p className="text-3xl font-bold">{formatCurrency(earnings.tillNow)}</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             
            
              <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Per Day</p>
                <p className="text-2xl font-semibold">{formatCurrency(earnings.day)}</p>
              </Card>
                <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Per Minute</p>
                <p className="text-2xl font-semibold">{formatCurrency(earnings.minute)}</p>
              </Card>
              <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Per Hour</p>
                <p className="text-2xl font-semibold">{formatCurrency(earnings.hour)}</p>
              </Card>
              <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Per Month</p>
                <p className="text-2xl font-semibold">{formatCurrency(earnings.month)}</p>
              </Card>
               <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Per Second</p>
                <p className="text-2xl font-semibold">{formatCurrency(earnings.second)}</p>
              </Card>
              <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Year to Date</p>
                <p className="text-2xl font-semibold">{formatCurrency(earnings.yearToDate)}</p>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Progress</span>
                  <span>{Math.round(earnings.monthProgress)}%</span>
                </div>
                <Progress value={earnings.monthProgress} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Yearly Progress</span>
                  <span>{Math.round(earnings.yearProgress)}%</span>
                </div>
                <Progress value={earnings.yearProgress} />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="icon" onClick={handleReset}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleExport}
            disabled={!!error}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <footer className="text-center text-sm text-muted-foreground">
        <div className="space-x-4">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Feedback</a>
          <a href="#" className="hover:underline">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}