
export const COLORS = {
  primary: '#E6F76A',
  secondary: '#A7E8C3',
  accent: '#F2C94C',
  background: '#0B0B0C',
  surface: '#141416',
  muted: '#1C1C1F',
  border: '#26262A',
  textMuted: '#9CA3AF',
  danger: '#EF4444',
  success: '#22C55E'
};

export const MOCK_HISTORY: any[] = [
  { id: '1', filename: 'Equipment_Log_Jan.csv', upload_time: '2024-05-10 14:20', record_count: 1250 },
  { id: '2', filename: 'Pump_Efficiency_Q1.csv', upload_time: '2024-05-08 09:15', record_count: 840 },
  { id: '3', filename: 'Pressure_Test_Vessel_B.csv', upload_time: '2024-05-05 16:45', record_count: 3200 },
];

export const MOCK_ANALYTICS: any = {
  id: '1',
  filename: 'Equipment_Log_Jan.csv',
  upload_time: '2024-05-10 14:20',
  total_records: 1250,
  numeric_columns_count: 5,
  categorical_columns_count: 3,
  statistics: [
    { column: 'Flowrate', mean: 45.2, min: 10.5, max: 88.3, unit: 'm³/h' },
    { column: 'Pressure', mean: 12.8, min: 5.2, max: 22.1, unit: 'bar' },
    { column: 'Temperature', mean: 185.4, min: 140.2, max: 230.8, unit: '°C' }
  ],
  chart_data: {
    bar_charts: [
      {
        label: 'Equipment Type Distribution',
        data: [
          { name: 'Centrifugal Pumps', value: 45 },
          { name: 'Heat Exchangers', value: 30 },
          { name: 'Reactors', value: 15 },
          { name: 'Separators', value: 10 }
        ]
      }
    ],
    line_charts: [
      {
        label: 'Flowrate Trend',
        data: Array.from({ length: 12 }, (_, i) => ({ timestamp: `May ${i + 1}`, value: Math.floor(Math.random() * 50) + 20 }))
      },
      {
        label: 'Pressure Trend',
        data: Array.from({ length: 12 }, (_, i) => ({ timestamp: `May ${i + 1}`, value: Math.floor(Math.random() * 10) + 5 }))
      }
    ]
  }
};
