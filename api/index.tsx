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
  const { castId } = c.req.param()

  const { cast } = await getCastById(castId)

  const url = cast.embeds.find((e: any) => {
    return e.url.includes("https://thecard.fun/war/challenge")
  }).url

  if (!url) {
    return c.error({ message: "Scounter didn't work..." })
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

  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          background: `url(${process.env.SITE_URL}/background.png)`,
          backgroundSize: "100% 100%",
          display: "flex",
          height: "100%",
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
            columnGap: "30px",
            rowGap: "25px",
            width: "1000px",
            margin: "auto",
          }}
        >
          {balances.map((balance, index) => (
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                width="110px"
                src={`${process.env.SITE_URL}/${index + 1}.png`}
                alt=""
              />
              <p
                style={{
                  fontSize: "48px",
                  color: "white",
                  marginLeft: "7px",
                }}
              >
                ×{balance.toString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    ),
  })
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
    description: "See your opponent hands!",
  }
)

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined"
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development"
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
