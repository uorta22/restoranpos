import { FloorPlan } from "./floor-plan"

export function TableManagement() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Masa Yönetimi</h2>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <FloorPlan />
      </div>
    </div>
  )
}
