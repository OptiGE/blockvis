// blocket_visualization.js

async function runVisualization() {
    function getTextByClassName(element, className) {
        const child = element.querySelector(className);
        return child ? child.textContent : null;
    }

    function extractNumber(inputString) {
        const stringWithSpaces = inputString.replace(/\u00A0/g, ' ');
        const dashIndex = stringWithSpaces.indexOf('-');
        const stringWithoutDash = dashIndex >= 0 ? stringWithSpaces.slice(0, dashIndex) : stringWithSpaces;
        const onlyDigits = stringWithoutDash.replace(/\D+/g, '');
        const number = parseInt(onlyDigits, 10);

        return number;
    }

    function parsePriceAndMileage(priceStr, mileageStr) {
        if (!priceStr || !mileageStr) {
            return null;
        }

        const price = parseInt(priceStr.replace(/\D+/g, ''));
        const mileage = extractNumber(mileageStr);

        console.log(`Price: ${price}, Mileage: ${mileage}`);

        return { price, mileage };
    }


    function getColorByAge(age, minAge, maxAge) {
        const t = (age - minAge) / (maxAge - minAge);
        const h = 234;
        const s = 79 + (100 - 79) * (1 - t);
        const l = 33 + (80 - 33) * (1 - t);
        const a = 1;
        return `hsla(${h}, ${s}%, ${l}%, ${a})`;
    }

    // Get all listings on the page
    const listings = Array.from(document.querySelectorAll('.styled__Article-sc-1kpvi4z-1'));

    // Extract data for each listing
    const allData = listings.map(listing => {
        const priceStr = getTextByClassName(listing, '.Price__StyledPrice-sc-1v2maoc-1');
        const mileageStr = getTextByClassName(listing, '.ParametersList__ListItem-sc-18ndpo4-2:nth-child(3)');
        const year = parseInt(getTextByClassName(listing, '.ParametersList__ListItem-sc-18ndpo4-2:nth-child(1)'), 10);
        const title = getTextByClassName(listing, '.Title__StyledTitle-sc-1v2maoc-2');
        const parsedData = parsePriceAndMileage(priceStr, mileageStr);
        if (!parsedData) {
            return null;
        }
        const { price, mileage } = parsedData;
        const age = (new Date()).getFullYear() - year;
        const color = getColorByAge(age);
        return { title, price, mileage, year, color, element: listing };
    }).filter(entry => entry !== null);

    const cleanData = allData.filter(x => x.price > 8000)

    const ages = cleanData.map(({ year }) => (new Date()).getFullYear() - year);
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const data = cleanData.map((entry, index) => {
        const age = ages[index];
        const color = getColorByAge(age, minAge, maxAge);
        return { ...entry, age, color };
    });

    // Load Chart.js library and chartjs-plugin-annotation
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(script1);
    const script2 = document.createElement('script');
    script2.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation';
    document.head.appendChild(script2);
    await Promise.all([
        new Promise(resolve => script1.onload = resolve),
        new Promise(resolve => script2.onload = resolve)
    ]);
    await Promise.all([
        import('https://cdn.jsdelivr.net/npm/chart.js'),
        import('https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation')
    ]);

    // Create a canvas element for the chart
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // Create a scatter plot with the extracted data
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    data: data.map(({ price, mileage }) => ({ x: mileage, y: price })),
                    borderColor: data.map(({ color }) => color),
                    backgroundColor: data.map(({ color }) => color),
                    pointRadius: 5,
                    pointHoverRadius: 7,
                },
            ],
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (context) => data[context[0].dataIndex].title,
                        label: (context) => {
                            const { price, mileage, year } = data[context.dataIndex];
                            return [
                                `Price: ${price}`,
                                `Driven Kilometers: ${mileage}`,
                                `Year: ${year}`
                            ];
                        }
                    }
                },
            },
            onClick: (_, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].element.dataIndex;
                    data[index].element.scrollIntoView({ behavior: 'smooth' });
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Driven Kilometers',
                    },
                    max: Math.max(...data.map(({ mileage }) => mileage)) * 1.1,
                    min: Math.min(...data.map(({ mileage }) => mileage)) * 0.8,
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price',
                    },
                    max: Math.max(...data.map(({ price }) => price)) * 1.1,
                    min: Math.min(...data.map(({ price }) => price)) * 0.8,
                },
            },
        },
    });
}

function waitForListings(callback) {
    const checkListings = () => {
        const listings = document.querySelectorAll('.styled__Article-sc-1kpvi4z-1');
        if (listings.length > 0) {
            callback();
        } else {
            setTimeout(checkListings, 500);
        }
    };
    checkListings();
}

// Run the visualization when the page content is loaded
if (window.location.hostname === 'www.blocket.se' || window.location.hostname === 'blocket.se') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            waitForListings(runVisualization);
        });
    } else {
        waitForListings(runVisualization);
    }
}


