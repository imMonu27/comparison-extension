import * as htmlToImage from "html-to-image";
function featureValue(title: string) {
    const feature = document.querySelector(`[title="${title}"]`);

    if (!feature) return undefined;

    return feature.querySelector("p")?.textContent?.trim();
}

function scrapeEstimate(section: Element): PropertyEstimate {

    return {

        confidence:
            section.querySelector(
                '[data-testid="valuation-sub-brick-confidence"]'
            )?.textContent?.trim(),

        value:
            section.querySelector(
                '[data-testid="valuation-sub-brick-price-text"]'
            )?.textContent?.trim(),

        pricePerSqm:
            section.querySelector('[class*=PricePerUnitBadge]')
                ?.textContent?.trim(),

        updated:
            section.querySelector(
                ".ContentBrick__Subtitle-sc-1sfxg8l-3"
            )?.textContent?.trim(),

        lowRange:
            section.querySelectorAll(
                '[data-testid="valuation-sub-brick-estimate-range"] p'
            )[0]?.textContent?.trim(),

        highRange:
            section.querySelectorAll(
                '[data-testid="valuation-sub-brick-estimate-range"] p'
            )[1]?.textContent?.trim()
    }

}

function scrapeRental(section: Element): RentalEstimate {

    return {

        confidence:
            section.querySelector(
                '[data-testid="valuation-sub-brick-confidence"]'
            )?.textContent?.trim(),

        value:
            section.querySelector(
                '[data-testid="valuation-sub-brick-price-text"]'
            )?.textContent?.trim(),

        updated:
            section.querySelector(
                ".ContentBrick__Subtitle-sc-1sfxg8l-3"
            )?.textContent?.trim(),

        lowRange:
            section.querySelectorAll(
                '[data-testid="valuation-sub-brick-estimate-range"] p'
            )[0]?.textContent?.trim(),

        highRange:
            section.querySelectorAll(
                '[data-testid="valuation-sub-brick-estimate-range"] p'
            )[1]?.textContent?.trim()
    }

}

function governmentOverlays() {
    const section = document.querySelector(
        'section[aria-label="Government planning overlays"]'
    );

    if (!section) return undefined;

    const result: string[] = [];

    section.querySelectorAll(".OverlayTiles__CardWrapper-sc-5blj98-1")
        .forEach(card => {

            const title =
                card.querySelector("p")?.textContent?.trim();

            const badge =
                card.querySelector(".Badge-sc-2q2m5z-0")?.textContent?.trim();

            if (title && badge) {
                result.push(`${title}: ${badge}`);
            }
        });

    return result.join(" | ");
}

function px(value: string) {
    return Number(value.replace("px", ""))
}

function scrapeBoundaryPolygon() {

    const vertices = document.querySelectorAll(
        ".PropertyBoundaryVertices__Vertex-sc-weqhy3-0"
    )

    return [...vertices].map(vertex => {

        const wrapper = vertex.parentElement as HTMLElement

        return {

            x: px(wrapper.style.left),

            y: px(wrapper.style.top)

        }

    })

}

async function captureBoundaryMap() {

    const map = document.querySelector(
        'section[aria-label="Property boundary"]'
    ) as HTMLElement;

    if (!map) {
        console.log("Map not found");
        return;
    }

    // wait for google map to finish drawing

    await new Promise(resolve => setTimeout(resolve, 2500));

    try {

        const image = await htmlToImage.toPng(map, {

            cacheBust: true,

            pixelRatio: 2,

            backgroundColor: "#ffffff"

        });

        console.log("IMAGE CREATED");

        return image;

    }

    catch(err){

        console.error("HTML TO IMAGE ERROR");

        console.error(err);

    }

}

export function scrapePropertyCom(): PropertyComDetails {

    const valuationSection =
    document.querySelector(
        'section[aria-label="Estimated value"]'
    )

const subSections =
    valuationSection?.querySelectorAll("section")

const propertyEstimate =
    subSections?.[0]
        ? scrapeEstimate(subSections[0])
        : undefined

const rentalEstimate =
    subSections?.[1]
        ? scrapeRental(subSections[1])
        : undefined

    return {

        bedrooms: featureValue("Bedrooms"),

        bathrooms: featureValue("Bathrooms"),

        parking: featureValue("Car spaces"),

        buildingSize: featureValue("Land size"),

        carpetSize: featureValue("Floor area"),

        buildYear:
            document.querySelector("time[datetime]")
                ?.textContent
                ?.trim(),

        propertyEstimate,
        rentalEstimate,
            

        propertyBoundary: {
            image: undefined
        },

        governmentPlanningOverlays:governmentOverlays(),

        capturedAt: Date.now(),
    }
}