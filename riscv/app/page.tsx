export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center w-screen space-y-4">
      <button className="bg-gray-500 text-white px-8 py-2 rounded shadow-md hover:bg-gray-600">
        RUN
      </button>
      <textarea
        placeholder="Write your code here..."
        className="w-3/4 h-64 border-2 border-black-400 rounded shadow-md p-3 bg-gray-50 font-mono text-sm"
      ></textarea>
      <div className="w-3/4 bg-gray-50 border-2 border-black rounded shadow-md p-4 space-y-3">
        <p className = "font-semibold text-sm">ERROR MESSAGE : NO ERRORS</p>
        <div className="flex justify-between text-sm font-mono">
          {/* Registers Section */}
          <div>
            <p className="font-semibold mb-1">REGISTERS</p>
            <p>x0 : 0xa | 19</p>
            <p>...</p>
          </div>

          {/* Memory Section */}
          <div>
            <p className="font-semibold mb-1">MEMORY:</p>
            <p>0x0000: 0xb | 11</p>
            <p>...</p>
          </div>
        </div>
      </div>

    </div>
  );
}
