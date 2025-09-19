"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface PipelineChartProps {
  data: any[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

const stageLabels = {
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
}

export function PipelineChart({ data }: PipelineChartProps) {
  const chartData = data.map((item) => ({
    stage: stageLabels[item.stage as keyof typeof stageLabels] || item.stage,
    count: item._count._all,
    value: item._sum.value || 0,
  }))

  const pieData = chartData
    .filter((item) => item.stage !== "Lost")
    .map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Opportunities by Stage */}
      <Card>
        <CardHeader>
          <CardTitle>Opportunities by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pipeline Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ stage, count }) => `${stage}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
