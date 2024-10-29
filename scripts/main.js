const fs = require("fs")

async function createRateCard() {
    const cityName = process.env.CITY_NAME || ""
    const clusterName = process.env.CLUSTER_NAME || ""
    const orgName = process.env.ORG_NAME || ""
    const rateCardFileLink = process.env.RATE_CARD_FILE_LINK || ""

    if (cityName === "" || clusterName === "" || rateCardFileLink === "") {
        throw "Invalid city name/cluster name/rate card file link"
    }

    console.log("City name", cityName)
    console.log("Cluster name", clusterName)
    console.log("Org name", orgName)
    console.log("Rate card file link", rateCardFileLink)
}

(async () => {
    try {
        const startTime = performance.now()
        await createRateCard()
        const endTime = performance.now()
        console.log(`Time taken: ${endTime - startTime} ms`);
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
})()
