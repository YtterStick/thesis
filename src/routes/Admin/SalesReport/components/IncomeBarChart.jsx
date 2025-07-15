import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/hooks/use-theme";

const IncomeBarChart = ({ data }) => {
  const { theme } = useTheme();
  const axisColor = theme === "dark" ? "#94a3b8" : "#475569";

  return (
    <div className="card">
      <div className="card-header">
        <p className="card-title">Income Overview</p>
      </div>
      <div className="card-body p-0">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <XAxis
              dataKey="date"
              stroke={axisColor}
              tickMargin={6}
              tickLine={false}
            />
            <YAxis
              stroke={axisColor}
              tickMargin={6}
              tickFormatter={(value) => `₱${value}`}
              tickLine={false}
            />
            <Tooltip
              cursor={false}
              formatter={(value) => `₱${value}`}
              labelStyle={{ color: axisColor }}
              contentStyle={{
                background: theme === "dark" ? "#0f172a" : "#f8fafc",
                borderRadius: 8,
                border: "none",
              }}
            />
            <Bar
              dataKey="total"
              fill="#3DD9B6"
              radius={[6, 6, 0, 0]}
              barSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeBarChart;