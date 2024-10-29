const fs = require("node:fs")
const path = require("node:path")
const {DOMParser, XMLSerializer} = require("@xmldom/xmldom")
const xmlFormatter = require("xml-formatter")

const capitalize = str => str.replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase())

const rateCardBaseDirectory = "../src/main/resources/excel/hyperlocal"
const kmoduleFilePath = "../src/main/resources/META-INF/kmodule.xml"
const kbasePackagePrefix = "com.titan.rule.drools.hyperlocal"

async function createRateCard() {
    let cityName = process.env.CITY_NAME || ""
    let clusterName = process.env.CLUSTER_NAME || ""
    let orgName = process.env.ORG_NAME || ""
    const rateCardFileLink = process.env.RATE_CARD_FILE_LINK || ""

    if (cityName === "" || clusterName === "" || rateCardFileLink === "") {
        throw new Error("invalid city name/cluster name/rate card file link")
    }

    const suffix = rateCardFileLink.substring(rateCardFileLink.lastIndexOf("."))
    if (suffix !== ".xlsx") {
        throw new Error(`invalid file type: ${suffix}`)
    }

    cityName = cityName.toLowerCase()
    clusterName = clusterName.toLowerCase()
    orgName = orgName.toLowerCase()
    console.log("City name: ", cityName)
    console.log("Cluster name: ", clusterName)
    console.log("Org name: ", orgName)
    console.log("Rate card file link: ", rateCardFileLink)

    let startTime = performance.now()
    await downloadAndSaveFile(cityName, clusterName,
        orgName, rateCardFileLink)
    let endTime = performance.now()
    console.log(`Time taken to download and save rate card: ${endTime - startTime} ms`)
    startTime = performance.now()
    modifyKModuleFile(cityName, clusterName, orgName)
    endTime = performance.now()
    console.log(`Time taken to modify kmodule: ${endTime - startTime} ms`)
}

async function downloadAndSaveFile(cityName, clusterName, orgName, rateCarFileLink) {
    let directoryPath = path.join(__dirname, rateCardBaseDirectory, cityName, clusterName)
    let fileName = path.basename(rateCarFileLink)
    if (fileName.indexOf(".xlsx") === -1 || fileName.indexOf("_") === -1) {
        throw new Error("invalid file name")
    }
    fileName = fileName.substring(0, fileName.indexOf("_")) + ".xlsx"
    const response = await fetch(rateCarFileLink)
    if (!response.ok) {
        throw new Error("non-success response while downloading rate card")
    }
    const buffer = await response.arrayBuffer()
    if (orgName !== "") {
        directoryPath = path.join(directoryPath, orgName)
    }
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, {recursive: true})
    }
    const filePath = path.join(directoryPath, fileName)
    fs.writeFileSync(filePath, Buffer.from(buffer))
    console.log(`File download and saved to ${filePath}`)
}

function modifyKModuleFile(cityName, clusterName, orgName) {
    let packageName = `${kbasePackagePrefix}.${cityName}.${clusterName}`
    let rateCardName = `${capitalize(cityName)}${capitalize(clusterName)}`
    if (orgName && orgName !== "") {
        packageName += `.${orgName}`
        rateCardName += `${capitalize(orgName)}`
    }
    rateCardName += "RateCard"
    console.log("Package name: ", packageName)
    console.log("Rate card name: ", rateCardName)

    const data = fs.readFileSync(kmoduleFilePath, {encoding: "utf8"})
    const parsedXml = new DOMParser().parseFromString(data, "application/xml")

    const newKbase = parsedXml.createElement("kbase")
    newKbase.setAttribute("packages", packageName)

    const newKsession = parsedXml.createElement("ksession")
    newKsession.setAttribute("name", rateCardName);
    newKsession.setAttribute("type", "stateless");

    newKbase.appendChild(newKsession)
    parsedXml.documentElement.appendChild(newKbase)

    const xmlSerializer = new XMLSerializer()
    const serializedXml = xmlFormatter(xmlSerializer.serializeToString(parsedXml))
    fs.writeFileSync(kmoduleFilePath, serializedXml)
}

(async () => {
    try {
        const startTime = performance.now()
        await createRateCard()
        const endTime = performance.now()
        console.log(`Total time taken: ${endTime - startTime} ms`);
    } catch (e) {
        console.error("Error", e)
        process.exit(1)
    }
})()
