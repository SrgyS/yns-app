import { DailyContentType } from '@/shared/lib/client-enums'
import { workoutApi } from '../_api'

type UpdateCompletionParams = {
  workoutId: string
  enrollmentId: string
  contentType: DailyContentType
  stepIndex: number
  isCompleted: boolean
}

type UpdateCompletionContext = {
  previousStatus?: boolean
}

function toCompletionStatusInput(params: Omit<UpdateCompletionParams, 'isCompleted'>) {
  return {
    workoutId: params.workoutId,
    enrollmentId: params.enrollmentId,
    contentType: params.contentType,
    stepIndex: params.stepIndex,
  }
}

export function useWorkoutCompletions() {
  const utils = workoutApi.useUtils()

  const updateWorkoutCompletionMutation =
    workoutApi.updateWorkoutCompletion.useMutation({
      async onMutate(variables): Promise<UpdateCompletionContext> {
        const queryInput = toCompletionStatusInput(variables)

        await utils.getWorkoutCompletionStatus.cancel(queryInput)

        const previousStatus =
          utils.getWorkoutCompletionStatus.getData(queryInput)

        utils.getWorkoutCompletionStatus.setData(
          queryInput,
          variables.isCompleted
        )

        return { previousStatus }
      },
      onError: (_error, variables, context) => {
        const queryInput = toCompletionStatusInput(variables)

        if (context?.previousStatus !== undefined) {
          utils.getWorkoutCompletionStatus.setData(
            queryInput,
            context.previousStatus
          )
          return
        }

        utils.getWorkoutCompletionStatus.invalidate(queryInput)
      },
      onSettled: (_data, _error, variables) => {
        utils.getWorkoutCompletionStatus.invalidate(
          toCompletionStatusInput(variables)
        )
      },
    })

  const updateWorkoutCompletion = async (params: UpdateCompletionParams) => {
    await updateWorkoutCompletionMutation.mutateAsync(params)
  }

  return {
    updateWorkoutCompletion,
    isUpdating: updateWorkoutCompletionMutation.isPending,
  }
}
