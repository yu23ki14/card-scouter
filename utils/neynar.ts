import axios from "axios"
import { config } from "dotenv"

config()

// Define interfaces for the expected response structure
export interface UserProfile {
  fid: string
  username: string
  bio: string
  profilePicture: string
  displayName: string
  addresses: string[]
}

/**
 * Fetches the profile of a user from Neynar API based on FID.
 * @param {string} fid - The FID of the user to fetch.
 * @returns {Promise<UserProfile | null>} The user profile or null in case of an error.
 */
const getProfileNeynarByFid = async (
  fid: string
): Promise<UserProfile | null> => {
  const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`
  const api = process.env.NEYNAR_API

  if (!api) {
    console.error("NEYNAR_API key is missing")
    return null
  }

  try {
    const { data } = await axios.get(url, {
      headers: {
        accept: "application/json",
        api_key: api,
      },
    })

    return data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Axios error: ${error.message}`)
    } else {
      console.error(`Unexpected error: ${error}`)
    }
    return null
  }
}

const getCastById = async (castId: string) => {
  const url = `https://api.neynar.com/v2/farcaster/cast?identifier=${castId}&type=hash`
  const api = process.env.NEYNAR_API

  if (!api) {
    console.error("NEYNAR_API key is missing")
    return null
  }

  try {
    const { data } = await axios.get(url, {
      headers: {
        accept: "application/json",
        api_key: api,
      },
    })

    return data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Axios error: ${error.message}`)
    } else {
      console.error(`Unexpected error: ${error}`)
    }
    return null
  }
}

export { getProfileNeynarByFid, getCastById }
