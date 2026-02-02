import * as z from "zod";

export const authSchema = z.object({
    email: z.email("Invalid email or password."),
    password: z.string().min(8, "Invalid email or password.").regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Invalid email or password.")

})

