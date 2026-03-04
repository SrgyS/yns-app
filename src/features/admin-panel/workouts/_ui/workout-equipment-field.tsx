'use client'

import { equipmentItems } from '@/shared/lib/equipment'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'

type WorkoutEquipmentFieldProps = {
  value: string[]
  onChange: (nextValue: string[]) => void
}

export function WorkoutEquipmentField({
  value,
  onChange,
}: Readonly<WorkoutEquipmentFieldProps>) {
  return (
    <div className="space-y-2 md:col-span-2">
      <Label>Инвентарь</Label>
      <div className="flex flex-wrap gap-2">
        {equipmentItems.map(item => {
          const checked = value.includes(item.id)

          return (
            <label
              key={item.id}
              className="flex items-center gap-2 rounded border px-3 py-2 text-xs"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={checkedState => {
                  const nextValue = new Set(value)

                  if (checkedState === true) {
                    nextValue.add(item.id)
                  } else {
                    nextValue.delete(item.id)
                  }

                  onChange(Array.from(nextValue))
                }}
              />
              {item.title}
            </label>
          )
        })}
      </div>
    </div>
  )
}
