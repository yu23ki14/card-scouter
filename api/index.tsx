import { Button, Frog, TextInput } from "frog"
import { devtools } from "frog/dev"
import { serveStatic } from "frog/serve-static"
// import { neynar } from 'frog/hubs'
import { handle } from "frog/vercel"
import dotenv from "dotenv"
import { createPublicClient, http } from "viem"
import { degen } from "viem/chains"
import { CARD_ABI, WAR_ABI } from "../utils/abi.js"
import { getCastById } from "../utils/neynar.js"
import satori from "satori"
import fs from "fs"
import path from "path"
import sharp from "sharp"

dotenv.config()

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

app.frame("/", (c) => {
  return c.res({
    image: "/title.png",
    intents: [
      <Button.AddCastAction action="/card-scouter">
        Wear Card Scouter
      </Button.AddCastAction>,
    ],
  })
})

app.frame("/result/:castId", async (c) => {
  return c.res({
    image: `${process.env.SITE_URL}/api/image/${c.req.param("castId")}`,
  })
})

app.hono.get("/image/:castId", async (c) => {
  const { castId } = c.req.param()

  const { cast } = await getCastById(castId)

  const url = cast.embeds.find((e: any) => {
    return e.url.includes("https://thecard.fun/war/challenge")
  }).url

  if (!url) {
    return c.res.json()
  }

  const gameId = url.split("/").pop()

  const publicClient = createPublicClient({
    chain: degen,
    transport: http(),
  })

  const game = await publicClient.readContract({
    abi: WAR_ABI,
    address: process.env.WAR_ADDRESS as `0x${string}`,
    functionName: "games",
    args: [gameId],
  })

  const address = game[0]

  const balances = await publicClient.readContract({
    abi: CARD_ABI,
    address: process.env.CONTRACT_ADDRESS as `0x${string}`,
    functionName: "balanceOfBatch",
    args: [
      new Array(14).fill(address),
      [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n, 12n, 13n, 14n],
    ],
  })

  let fontPath = path.join(process.cwd(), "public/Roboto-Regular.ttf")
  const font = fs.readFileSync(fontPath)

  const svg = await satori(
    <div
      style={{
        alignItems: "center",
        background: `url(${process.env.SITE_URL}/background.png)`,
        backgroundSize: "100% 100%",
        display: "flex",
        width: "995px",
        height: "500px",
        justifyContent: "space-between",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: "15px",
          rowGap: "12.5px",
          width: "900px",
          margin: "auto",
        }}
      >
        {balances.map((balance, index) => (
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              width="100px"
              src={`${process.env.SITE_URL}/${index + 1}.png`}
              alt=""
            />
            <p
              style={{
                fontSize: "30px",
                color: "white",
                marginLeft: "7px",
              }}
            >
              ×{balance.toString()}
            </p>
          </div>
        ))}
      </div>
    </div>,
    {
      width: 995,
      height: 500,
      fonts: [
        {
          name: "Roboto",
          // Use `fs` (Node.js only) or `fetch` to read the font as Buffer/ArrayBuffer and provide `data` here.
          data: font,
          weight: 400,
          style: "normal",
        },
      ],
    }
  )

  const png = await sharp(Buffer.from(svg)).png().toBuffer()

  return c.newResponse(png, 200, { contentType: "image/png" })
})

app.castAction(
  "/card-scouter",
  (c) => {
    const castId = c.actionData.castId.hash

    return c.res({
      type: "frame",
      path: "/result/" + castId,
    })
  },
  {
    name: "/card Scounter",
    icon: "eye",
    description: "Unveil Opponent Hands! A Strong Weapon in Every Card Game!",
  }
)

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined"
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development"
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
