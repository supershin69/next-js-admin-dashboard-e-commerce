"use client"
import Image from "next/image";
import LoginSideImage from "@/public/img/login-side-pic.webp";
import { useForm } from "react-hook-form";
import { FormFields } from "../types/FormFields";
import { zodResolver } from "@hookform/resolvers/zod";
import { authSchema } from "../zodschema/authSchema";
import client from "../api/client";
import { redirect } from "next/navigation";
const LoginForm = () => {
    const { register, handleSubmit, setError, formState: { errors, isSubmitting }} = useForm<FormFields>({resolver: zodResolver(authSchema)});
    const onSubmit = async (loginData: FormFields) => {
        const email = loginData.email;
        const password = loginData.password;

        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setError("root", {
                type: "manual",
                message: "Invalid email or password."
            });
            return;
        }

        console.log('Login Successful.');
        redirect("/dashboard");
    }

    const hasError = errors.email || errors.password || errors.root;
  return (
    <div className="min-h-screen flex justify-center items-center bg-light-grey text-black">
        {/* Login Card */}
        <div className="w-full max-w-4xl bg-white rounded-2xl flex flex-col md:flex-row shadow-2xl bottom-top-animate">
            { /* Left Section */}
            <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col space-y-4">
                <p className="text-xs font-medium mb-12">DigitalHub</p>
                <h1 className="font-semibold text-3xl">Hello,</h1>
                <h1 className="font-semibold text-3xl">Welcome Back!</h1>
                <p className="font-light text-gray-500 text-xs">Hey, welcome back to our admin dashboard.</p>
                <form action="" className="space-y-4 my-4" onSubmit={handleSubmit(onSubmit)}>
                    <input {...register("email")} type="text" className={`border ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-400 focus:ring-light-purple'} w-full focus:ring focus:outline-none rounded-lg py-1 px-4`} placeholder="Email"/>
                    <input {...register("password")} type="password" className={`border ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-400 focus:ring-light-purple'} w-full focus:ring focus:outline-none rounded-lg py-1 px-4`} placeholder="Password"/>
                    { hasError && (
                        <p className="text-red-500 text-sm">Invalid email or password.</p>
                    )}
                    <a href="#" className="text-xs hover:text-light-purple hover:underline block">Forgot Password?</a>
                    <button disabled={isSubmitting} className="py-2 px-4 bg-light-purple text-white rounded-md text-sm mt-4 hover:brightness-95">{ isSubmitting ? 'Signing In...' : 'Sign In' }</button>
                </form>
            </div>
            {/* Right Section */}
            <div className="w-1/2 p-2">
                <Image src={LoginSideImage} alt="Login Side Image" className="rounded-xl h-full hidden md:block"></Image>

            </div>
        </div>
    </div>
  )
}
export default LoginForm