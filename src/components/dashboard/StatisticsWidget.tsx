import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatisticsWidgetProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trendLabel?: string;
  trendTone?: 'positive' | 'negative' | 'neutral';
  footer?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
}

const trendToneClasses: Record<NonNullable<StatisticsWidgetProps['trendTone']>, string> = {
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  neutral: 'text-muted-foreground',
};

const StatisticsWidget: React.FC<StatisticsWidgetProps> = ({
  title,
  value,
  description,
  icon,
  trendLabel,
  trendTone = 'neutral',
  footer,
  loading = false,
  children,
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="rounded-full bg-muted p-2 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-semibold text-gray-900">
              {value}
            </div>
            {description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}
            {trendLabel && (
              <p className={`mt-3 text-sm font-medium ${trendToneClasses[trendTone]}`}>
                {trendLabel}
              </p>
            )}
            {children && (
              <div className="mt-4">
                {children}
              </div>
            )}
          </>
        )}
      </CardContent>
      {footer && !loading && (
        <div className="border-t px-6 py-3 text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </Card>
  );
};

export default StatisticsWidget;
