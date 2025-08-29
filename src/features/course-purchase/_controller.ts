import { injectable } from 'inversify'
import { Controller, router } from '@/kernel/lib/trpc/module'

@injectable()
export class CoursePurchaseController extends Controller {
  constructor() {
    super()
  }

  public router = router({
    coursePurchase: {},
  })
}
