import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Si usas file-saver con npm install file-saver
// import { saveAs } from "file-saver";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function App() {
  const [csvText, setCsvText] = useState("");
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [xColumn, setXColumn] = useState("");
  const [yColumn, setYColumn] = useState("");
  const [orientation, setOrientation] = useState("vertical");
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState({});
  const chartRef = useRef(null);

  // Parsear CSV
  const parseCSV = () => {
    try {
      const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      if (result.errors.length) {
        setError("CSV mal formateado: " + result.errors[0].message);
        return;
      }
      setError("");
      setData(result.data);
      setColumns(result.meta.fields);
    } catch (e) {
      setError("Error al parsear CSV: " + e.message);
    }
  };

  // Cargar CSV desde archivo
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length) {
          setError("CSV mal formateado: " + results.errors[0].message);
          return;
        }
        setError("");
        setData(results.data);
        setColumns(results.meta.fields);
      },
    });
  };

  // Filtros
  const handleFilterChange = (col, value) => {
    setFilters((prev) => ({ ...prev, [col]: value }));
  };

  const filteredData = data.filter((row) =>
    Object.entries(filters).every(([col, value]) =>
      row[col]?.toString().toLowerCase().includes(value.toLowerCase())
    )
  );

  // Configuración de gráfico
  const chartData = {
    labels: filteredData.map((row) => row[xColumn]),
    datasets: [
      {
        label: yColumn,
        data: filteredData.map((row) => Number(row[yColumn]) || 0),
        backgroundColor: darkMode ? "#ffffff" : "#000000",
      },
    ],
  };

  const chartOptions = {
    indexAxis: orientation === "horizontal" ? "y" : "x",
    responsive: true,
    plugins: {
      legend: { labels: { color: darkMode ? "bg-gray-800 text-white" : "bg-white text-black" } },
      title: {
        display: true,
        text: "Visualización CSV",
        color: darkMode ? "bg-gray-800 text-white" : "bg-white text-black",
      },
    },
    scales: {
      x: { ticks: { color: darkMode ? "bg-gray-800 text-white" : "bg-white text-black" } },
      y: { ticks: { color: darkMode ? "bg-gray-800 text-white" : "bg-white text-black" } },
    },
  };

  // Exportar gráfico como PNG
const exportChartPNG = () => {
  if (!chartRef.current) return;
  try {
    const chartInstance = chartRef.current;
    const url = chartInstance.toBase64Image();

    // Crear canvas con fondo blanco
    const image = new Image();
    image.src = url;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff"; // Fondo blanco
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      const finalUrl = canvas.toDataURL("image/png");

      const a = document.createElement("a");
      a.href = finalUrl;
      a.download = "chart.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
  } catch (e) {
    setError("Error exportando: " + e.message);
  }
};





  return (
    <div
      className={`min-h-screen p-4 ${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <h1 className="text-2xl font-bold mb-4">
        Visualizador Interactivo de CSV
      </h1>

      {/* Modo oscuro */}
      <button
        className="mb-4 px-3 py-1 border rounded"
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? "Modo Claro" : "Modo Oscuro"}
      </button>

      {/* Área de CSV */}
      <textarea
        className={`w-full h-32 p-2 border mb-4 ${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
        }`}
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder="Pega aquí tus datos CSV"
      />

      <div className="flex gap-2 mb-4">
        <button className="px-3 py-1 border rounded" onClick={parseCSV}>
          Procesar CSV
        </button>
        <input type="file" accept=".csv" onChange={handleFileUpload} />
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Tabla */}
      {data.length > 0 && (
        <div className="overflow-auto mb-4">
          <table className="border-collapse border w-full text-sm">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} className="border px-2 py-1">
                    {col}
                  </th>
                ))}
              </tr>
              <tr>
                {columns.map((col) => (
                  <th key={col} className="border px-2 py-1">
                    <input
                      type="text"
                      placeholder={`Filtrar ${col}`}
                      className={`w-full p-1 text-sm ${
                        darkMode ? "bg-gray-800 text-white" : "bg-white"
                      }`}
                      value={filters[col] || ""}
                      onChange={(e) =>
                        handleFilterChange(col, e.target.value)
                      }
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border px-2 py-1">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Controles del gráfico */}
      {columns.length > 0 && (
        <div className="mb-4 space-y-2">
          <div>
            <label className="mr-2">Columna X:</label>
            <select
              className="border p-1"
              value={xColumn}
              onChange={(e) => setXColumn(e.target.value)}
            >
              <option value="">--Seleccionar--</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mr-2">Columna Y:</label>
            <select
              className="border p-1"
              value={yColumn}
              onChange={(e) => setYColumn(e.target.value)}
            >
              <option value="">--Seleccionar--</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mr-2">Orientación:</label>
            <select
              className="border p-1"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
            >
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>

          <button
            className="px-3 py-1 border rounded"
            onClick={exportChartPNG}
          >
            Exportar PNG
          </button>
        </div>
      )}

      {/* Gráfico */}
      {xColumn && yColumn && (
        <div className="bg-gray-100 p-4 rounded shadow-md dark:bg-gray-900">
          <Bar ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}
