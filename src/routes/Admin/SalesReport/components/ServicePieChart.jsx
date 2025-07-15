import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@/hooks/use-theme";

const COLORS = ["#3DD9B6", "#FFA500", "#60A5FA", "#A78BFA", "#F472B6"];

const ServicePieChart = ({ data }) => {
  const { theme } = useTheme();
  const axisColor = theme === "dark" ? "#94a3b8" : "#475569";

  return (
    <div className="card">
      <div className="card-header">
        <p className="card-title">Service Distribution</p>
      </div>
      <div className="card-body p-0">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={false}
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${value} orders`}
              contentStyle={{
                background: theme === "dark" ? "#0f172a" : "#f8fafc",
                borderRadius: 8,
                border: "none",
              }}
              labelStyle={{ color: axisColor }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ServicePieChart;