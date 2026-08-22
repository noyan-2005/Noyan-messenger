
export default function ChatSearch() {
  return (
      <div className="px-4 pb-4">
        <div className="flex items-center rounded-3xl bg-gray-100 px-3">
          <span className="mr-2 text-gray-400">
            
          </span>

          <input
            type="search"
            placeholder="Search "
            className="
              h-10
              w-full
              bg-transparent
              text-sm
              text-gray-900
              outline-none
              placeholder:text-gray-400
            "
          />
        </div>
      </div>
  )
}
