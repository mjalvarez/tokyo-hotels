const endpoint = 'https://5c08f37bea3172001389ccbd.mockapi.io/hotels/tokyo';
new Vue({
  el: '#app',
  data() {
    return {
      currency: Cookies.get('currency') || 'USD',
      loading: true,
      hotels: [],
      rates: {}
    }
  },

  created() {
    axios.get(endpoint).then((response) => {
      this.hotels = response.data
      this.loading = false
      this.fetchRates()
    })
  },

  methods: {
    onCurrencySelect() {
      Cookies.set('currency', this.currency)
      this.fetchRates()
    },

    fetchRates() {
      if(this.rates[this.currency]) {
        // Apply memoized rates based on currency
        this.applyRates(this.rates[this.currency])
      } else {
        // Fetch hotel rates based on currency
        axios.get(this.ratesEndpointForCurrency()).then((response) => {
          // Memoize fetched rates to save remote requests
          this.rates[this.currency] = this.roundRates(response.data)
          // Apply fetched rates
          this.applyRates(response.data)
        }).catch((error) => {
          // If request failed, e.g. missing rates, apply empty rates to all hotels
          this.applyRates([])
        })
      }
    },

    ratesEndpointForCurrency() {
      return endpoint + '/1/' + this.currency
    },

    roundRates(rates) {
      switch(this.currency) {
        case 'USD':
        case 'SGD':
        case 'CNY':
          rates.map( rate => rate.rounded_price = this.roundToNearest1(rate.price) );
          break;
        case 'KRW':
        case 'JPY':
        case 'IDR':
          rates.map( rate => rate.rounded_price = this.roundToNearest100(rate.price) );
          break;
        default:
          //noop
      }
      return rates
    },

    applyRates(rates) {
      var pricedHotels = this.hotels.map(
        hotel => Object.assign(hotel, this.findRate(hotel, rates))
      )
      this.hotels = this.sort(pricedHotels)
    },

    sort(hotels) {
      // Define other sorting rules here
      var ascendingPrice = function() {
        return function (a, b) {
          if (a.price === null) {
            return 1;
          }
          else if (b.price === null) {
            return -1;
          }
          else if (a.price === b.price) {
            return 0;
          }
          else {
            return a.price < b.price ? -1 : 1;
          }
        }
      }
      return hotels.sort(ascendingPrice())
    },

    findRate(hotel, rates) {
      var hotelRate = rates.find(rate => rate.id == hotel.id)
      if(!hotelRate) {
        hotelRate = { id: hotel.id, rounded_price: 'Rates Unavailable', price: null }
      }
      return hotelRate
    },

    roundToNearest1(price) {
      return Number(Math.round(price)).toLocaleString()
    },

    roundToNearest100(price) {
      return Number(Math.round(price/100) * 100).toLocaleString()
    }
  }
})