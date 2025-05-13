"use server";

export default async function handleFormAction(formData) {
  const email = formData.get("email");
  console.log("Server received:", email);
}