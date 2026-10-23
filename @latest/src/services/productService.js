const API_URL = "https://dummyjson.com/products"

export async function getProducts() {
  const response = await fetch(`${API_URL}`);

  if (!response.ok) {
    throw new Error("Failed to fetch products.");
  }
  const data = await response.json();
  return data.products;
}

export async function getProductById(id) {
  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch product.");
  }
  return response.json();
}