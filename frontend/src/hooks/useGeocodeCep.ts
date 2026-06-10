import { useState, useEffect } from 'react'

export interface Coords {
  lat: number
  lng: number
}

// Cache em memória para não bater na API toda vez
const cache = new Map<string, Coords>()

// Coordenadas de Joinville/SC como fallback
const JOINVILLE_CENTER: Coords = { lat: -26.3044, lng: -48.8487 }

async function geocodeCep(cep: string): Promise<Coords> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return JOINVILLE_CENTER

  if (cache.has(digits)) return cache.get(digits)!

  try {
    // 1. ViaCEP para obter cidade/logradouro
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    if (!res.ok) throw new Error('ViaCEP falhou')
    const data = await res.json()
    if (data.erro) throw new Error('CEP não encontrado')

    // 2. Nominatim para converter endereço em lat/lng
    const query = [data.logradouro, data.bairro, data.localidade, data.uf, 'Brasil']
      .filter(Boolean)
      .join(', ')

    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { 'Accept-Language': 'pt-BR' } }
    )
    const geoData = await geoRes.json()
    if (!geoData.length) throw new Error('Nominatim sem resultado')

    const coords: Coords = { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) }
    cache.set(digits, coords)
    return coords
  } catch {
    // Fallback: coordenada aleatória em Joinville
    const coords: Coords = {
      lat: JOINVILLE_CENTER.lat + (Math.random() - 0.5) * 0.06,
      lng: JOINVILLE_CENTER.lng + (Math.random() - 0.5) * 0.06,
    }
    cache.set(digits, coords)
    return coords
  }
}

export function useGeocodeCep(cep?: string) {
  const [coords, setCoords] = useState<Coords | null>(null)

  useEffect(() => {
    if (!cep) {
      setCoords({
        lat: JOINVILLE_CENTER.lat + (Math.random() - 0.5) * 0.06,
        lng: JOINVILLE_CENTER.lng + (Math.random() - 0.5) * 0.06,
      })
      return
    }
    geocodeCep(cep).then(setCoords)
  }, [cep])

  return coords
}

export { geocodeCep, JOINVILLE_CENTER }
