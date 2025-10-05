export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center w-screen space-y-4">
      <button className="bg-gray-500 text-white px-4 py-2 rounded">
        RUN
      </button>
      <textarea
        placeholder="code"
        className="w-1/2 h-40 border border-black-300 rounded p-2"
      ></textarea>
      <text className="w-1/2 h-40 border border-black-300 rounded p-2">
        ERROR MESSAGE : NO ERRORS
      </text>
    </div>
  );
}
