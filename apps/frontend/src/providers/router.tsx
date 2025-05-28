import { RouterProvider } from "react-router"
import { router } from "@/src/routes"

export const Router = () => {
    return <RouterProvider router={router} />
}