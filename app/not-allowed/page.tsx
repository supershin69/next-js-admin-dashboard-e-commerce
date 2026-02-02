import Link from "next/link"

const NotAllowed = () => {
  return (
    <>
    <div>NotAllowed</div>
    <Link href="/login" className="underline">Go To Login Page</Link>
    </>
  )
}
export default NotAllowed