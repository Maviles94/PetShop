var URI = "https://amazing-events.herokuapp.com/api/events"
let select_filter = document.getElementById('input-filter') //Select
let button_filter = document.getElementById('filter-button') // Button filter
let search_input = document.getElementById('search-input')
let filters_row = document.getElementById('filters-row')
let active_categories = []
let cards_row = null
let cards_info = null
const exist_upcoming = document.getElementById("upcoming-cards")
const exist_past = document.getElementById("past-cards")
const exist_index = document.getElementById("index-cards")
const details_container = document.getElementById('details-container')
const exist_stats = document.getElementById('tables-info')
function get_data(URL) {
    fetch(URL).then(response => response.json()).then(fetch_data => {
        //Inicializar
        let current_date = fetch_data['currentDate']
        cards_info = fetch_data['events']
        //Detectando si estamos en details
        if (!!details_container) {
            let params = location.search
            let id = new URLSearchParams(params).get('id')
            renderDetailData(id)
            return
        }
        //Detectando si estamos en stats
        if (!!exist_stats) {
            let all_categories_upcoming = new Set()
            let all_categories_past = new Set()
            let upcoming_events_array = []
            let past_events_array = []
            let upcoming_table = document.getElementById('table-body-upcoming')
            let past_table = document.getElementById('table-body-past')
            let main_table = document.getElementById('table-body-statistics')
            cards_info.forEach(event => {
                // Para hallar % es x/total
                // Obtenemos x
                const assistance = parseInt(event['assistance'] ? event['assistance'] : event['estimate'])
                // Obtenemos el total
                const capacity = parseInt(event['capacity'])
                // x/total 
                event['percentage_attendance'] = (100 * (assistance / capacity))
                // ganancia = asistencia * precio
                event['revenue'] = assistance * event['price']
                // Aprovechamos el ciclo para sacar los arreglos de eventos futuros, eventos pasados y los arreglos que corresponden a todas las posibles categorías
                if (current_date <= event['date']) {
                    all_categories_upcoming.add(event['category'])
                    upcoming_events_array.push(event)
                } else {
                    all_categories_past.add(event['category'])
                    past_events_array.push(event)
                }
            })
            //Declarar de qué largo quiero la tabla
            let large_table = 5
            array_highest_attendance = cards_info
            array_lowest_attendance = cards_info
            array_largest_capacity = cards_info



            array_highest_attendance = array_highest_attendance.sort((a, b) => {//Declarar los arreglos ordenados
                return b.percentage_attendance - a.percentage_attendance
            })
            array_highest_attendance = array_highest_attendance.slice(0, large_table)//Recortar los arreglos ordenados del largo que quiero la tabla

            array_lowest_attendance = array_lowest_attendance.sort((a, b) => {
                return a.percentage_attendance - b.percentage_attendance
            })
            array_lowest_attendance = array_lowest_attendance.slice(0, large_table)

            array_largest_capacity = array_largest_capacity.sort((a, b) => {
                return b.capacity - a.capacity
            })
            array_largest_capacity = array_largest_capacity.slice(0, large_table)

            let array_general_stats = []
            for (let i = 0; i < large_table; i++) {
                row =
                    [
                        array_highest_attendance[i]['name'],
                        array_highest_attendance[i]['percentage_attendance'].toFixed(2) + '%',
                        array_lowest_attendance[i]['name'],
                        array_lowest_attendance[i]['percentage_attendance'].toFixed(2) + '%',
                        array_largest_capacity[i]['name'],
                        array_largest_capacity[i]['capacity']
                    ]
                array_general_stats.push(row)
            }

            all_categories_upcoming = Array.from(all_categories_upcoming).sort() //Set() to Array ordenado a-b
            all_categories_past = Array.from(all_categories_past).sort() //Set() to Array ordenado a-b
            //Log info
            data_average_upcoming = average_category(all_categories_upcoming, upcoming_events_array)
            data_average_past = average_category(all_categories_past, past_events_array)
            draw_rows_table(data_average_upcoming, upcoming_table)
            draw_rows_table(data_average_past, past_table)
            draw_rows_table(array_general_stats, main_table)
            return
        }
        if (!!exist_upcoming) {
            cards_info = cards_info.filter(event => current_date <= event['date'])
            cards_row = exist_upcoming
        }
        if (!!exist_past) {
            cards_info = cards_info.filter(event => current_date > event['date'])
            cards_row = exist_past
        }
        if (!!exist_index) {
            cards_row = exist_index
        }
        draw_info(cards_info)

        //Bloque de filtro
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------
        //Obteniendo todas las categorías posibles para después generarlas en el select de los filtros
        let all_categories = new Set()
        cards_info.forEach(event => all_categories.add(event['category']))
        //Creando un array con las categorías ordenadas en orden alfabético
        const sorted_categories = Array.from(all_categories).sort()
        //Imprimiendo las categorías en el Select de los filtros
        sorted_categories.forEach(category => {
            let option_add = document.createElement('option')
            option_add.innerHTML = `${category}`
            select_filter.appendChild(option_add)
        })
        //Cuando se escriba en el search
        search_input.addEventListener('keyup', () => {
            let text_query = search_input.value.toLowerCase().trim()
            filter1 = filter_by_category(cards_info, text_query)
            final_filter = filter_by_input(filter1, text_query)
            draw_info(final_filter)
        })
        //Cuando se use el botón filter
        button_filter.addEventListener('click', () => {
            let text_query = select_filter.value
            if (!active_categories.includes(text_query)) {
                active_categories.push(text_query)
                //console.log(active_categories)
                print_alert(text_query)
                filter1 = filter_by_input(cards_info, search_input.value.toLowerCase().trim())
                final_filter = filter_by_category(filter1)
                draw_info(final_filter)
            }
        })
        //Leer cuando se presione una X (Las alertas están en #filters-row)
        filters_row.addEventListener('click', (e) => {
            target_expected = e.target
            if (target_expected.classList.contains('close')) {
                filters_row.removeChild(target_expected.parentNode)
                const index = active_categories.indexOf(target_expected.getAttribute('info-filter'))
                active_categories.splice(index, 1)
                //console.log(active_categories)
                filter1 = filter_by_input(cards_info, search_input.value.toLowerCase().trim())
                final_filter = filter_by_category(filter1)
                draw_info(final_filter)
            }
        })

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------
    })
}
get_data(URI)
// Función que "pinta" en el HTML el arreglo
function draw_info(array_data) {
    //Borrar contenido
    cards_row.innerHTML = ''
    //Generar las cards en el HTML
    if (array_data.length) {
        array_data.forEach(evento => {
            let div = document.createElement('div')
            div.classList.add('col-sm-6', 'col-lg-4', 'd-flex', 'justify-content-center', 'mt-4', 'mb-4')
            div.innerHTML = `
                        <div class="hover-shadow card" style="width: 18rem;">
                            <img src="${evento['image']}" class="card-img-top" alt="1">
                            <div class="card-body">
                                <h5 class="card-title center">${evento['name']}</h5>
                                <p class="card-text">${evento['description']}</p>
                            </div>
                            <div class="card-body d-flex align-items-end">
                                <div class="d-flex flex-row justify-content-between align-items-center w-100 pt-3 border-top">
                                    <span class="price-text">Price: $${evento['price']}</span>
                                    <a class="btn btn-primary show-more text-white" href="details.html?id=${evento['_id']}">Show more</a>
                                </div>
                            </div>
                        </div>
                        `
            cards_row.appendChild(div)
        });
    } else {
        //Imprimir que no se encontró resultados (si aplica)
        let div = document.createElement('div')
        div.classList.add('col-12', 'd-flex', 'justify-content-center', 'mt-4', 'mb-4', 'align-items-center')
        div.innerHTML = `
                        <p class="text-center">
                            There are no items to display
                        </p>
                        `
        cards_row.appendChild(div)
    }
}
//Crear la alerta que indica que el filtro de categoría está activo
function print_alert(text_query) {
    let div_alert = document.createElement('div')
    div_alert.classList.add('alert', 'alert-danger', 'alert-dismissible', 'fade', 'show', 'm-2')
    div_alert.setAttribute("role", "alert")
    div_alert.innerHTML = `
                <strong>${text_query}</strong>
                <button type="button" class="close" data-dismiss="alert" aria-label="Close" info-filter="${text_query}">
                    &times;
                </button>
                `
    filters_row.appendChild(div_alert)
}
//Filtar por categoría
function filter_by_category(array_data) {
    let alerts = Array.from(document.querySelectorAll("button[class='close']"))
    alerts = alerts.map(alert => alert.getAttribute("info-filter"))
    if (alerts.length) {
        let array_filtered = []
        array_filtered = array_data.filter(evento => alerts.includes(evento['category']))
        return array_filtered
    } else {
        return array_data
    }
}
//Filtrar por search
function filter_by_input(array_data, text_query) {
    let result = array_data.filter(evento => evento['description'].toLowerCase().includes(text_query) || evento['name'].toLowerCase().includes(text_query))
    return result
}
//Formatear el número a dólares
let dollarUS = Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
})
//Función que calcula del promedio de asistencia de cada category y las ganancias
function average_category(array_categories, events_array) {
    //forEach que recorre cada categoría posible
    array_categories.forEach(function (category, index, array_categories) {
        //Acumulador de ganancias
        let revenue = 0
        //Acumulador de porcentaje de asistencia
        let percentage_attendance = 0
        //Contador de cantidad de coincidencias para sacar promedio
        let n = 0
        events_array.forEach(event => {
            if (event['category'].includes(category)) {
                //Se acumula el porcentaje, las ganancias y se cuenta las repeticiones con n
                percentage_attendance += event['percentage_attendance']
                revenue += event['revenue']
                n++
            }
        })
        array_categories[index] = { //Se transforma el array a un array de objetos para que sea más fácil de leer
            'category': category,
            'revenues': dollarUS.format(revenue), //ganancias para la categoría
            'percentage_attendance': ((percentage_attendance / n).toFixed(2)) + '%', //promedio de la asistencia para la categoría (redondeado 2 decimales)
        }
    })// end foreach
    return array_categories
}
function draw_rows_table(array_data, container) {
    //Aquí uso 2 for para hacer una función que genere filas de cualquier array que le mande sin saber cuántas columnas va a imprimir
    array_data.forEach(elementY => {// Empiezo a recorrer la fila del array
        let row = document.createElement('tr')
        row.innerHTML = ``
        for (elementX in elementY) {//Empiezo a recorrer la columna del array
            row.innerHTML += `<td>${elementY[elementX]}</td>`//dato = fila[columna]
        }
        container.appendChild(row)
    })
}
function renderDetailData(idData) {
    let event_render = cards_info.find(event => event['_id'] == idData)
    let cardDetail = document.createElement('div')
    cardDetail.className = 'card'
    cardDetail.innerHTML = `
                            <img class="card-img-top detail-card" src="${event_render['image']}">
                            <div class="card-body">
                                <h5 class="card-title">${event_render['name']}</h5>
                                <p class="card-text">Date: ${event_render['date']}</p>
                                <p class="card-text">Category: ${event_render['category']}</p>
                                <p class="card-text">About: ${event_render['description']}</p>
                                <p class="card-text">Place: ${event_render['place']}</p>
                                <p class="card-text">Capacity: ${event_render['capacity']}</p>
                                <p class="card-text">Assistance: ${event_render['assistance'] ? event_render['assistance'] : event_render['estimate']}</p>
                                <p class="card-text">Price: $${event_render['price']}</p>
                            </div>
                                    `
    details_container.appendChild(cardDetail)
}