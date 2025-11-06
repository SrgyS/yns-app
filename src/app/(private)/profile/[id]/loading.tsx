
import { Spinner } from "@/shared/ui/spinner";

export  default function Loading() {
    return (
         <div className="inset-0 flex items-center justify-center absolute">
           <Spinner
             className="w-10 h-10 text-primary"
             aria-label="Page loading"
           />
         </div>
       )
}