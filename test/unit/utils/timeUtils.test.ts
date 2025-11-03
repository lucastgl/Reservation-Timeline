import {
  pad,
  minutesToLabel,
  generateTimeSlots,
  timeSlotToISO,
  getCurrentMinutes,
} from '../../../components/reservations/ReservationGrid/utils/timeUtils'

describe('timeUtils', () => {
  describe('pad', () => {
    it('debe agregar cero a la izquierda para números de un dígito', () => {
      expect(pad(5)).toBe('05')
      expect(pad(9)).toBe('09')
    })

    it('no debe modificar números de dos dígitos', () => {
      expect(pad(10)).toBe('10')
      expect(pad(23)).toBe('23')
    })
  })

  describe('minutesToLabel', () => {
    it('debe convertir minutos a formato HH:MM', () => {
      expect(minutesToLabel(0)).toBe('00:00')
      expect(minutesToLabel(60)).toBe('01:00')
      expect(minutesToLabel(870)).toBe('14:30')
      expect(minutesToLabel(1440)).toBe('00:00') // 24 horas = 00:00
    })

    it('debe manejar minutos no redondos', () => {
      expect(minutesToLabel(75)).toBe('01:15')
      expect(minutesToLabel(945)).toBe('15:45')
    })
  })

  describe('generateTimeSlots', () => {
    it('debe generar slots de 11:00 a 24:00 con intervalos de 15 min', () => {
      const slots = generateTimeSlots()
      
      // Primer slot debe ser 11:00 (660 minutos)
      expect(slots[0]).toBe(660)
      
      // Último slot debe ser 24:00 (1440 minutos)
      expect(slots[slots.length - 1]).toBe(1440)
      
      // Debe haber 53 slots (13 horas * 4 intervalos + 1)
      expect(slots.length).toBe(53)
    })

    it('cada slot debe estar separado por 15 minutos', () => {
      const slots = generateTimeSlots()
      
      for (let i = 1; i < slots.length; i++) {
        expect(slots[i] - slots[i - 1]).toBe(15)
      }
    })
  })

  describe('timeSlotToISO', () => {
    it('debe convertir un slot de tiempo a formato ISO', () => {
      const isoString = timeSlotToISO(660) // 11:00
      const date = new Date(isoString)
      
      expect(date.getHours()).toBe(11)
      expect(date.getMinutes()).toBe(0)
    })

    it('debe manejar diferentes slots', () => {
      const afternoon = timeSlotToISO(870) // 14:30
      const dateAfternoon = new Date(afternoon)
      
      expect(dateAfternoon.getHours()).toBe(14)
      expect(dateAfternoon.getMinutes()).toBe(30)
    })
  })

  describe('getCurrentMinutes', () => {
    it('debe devolver el tiempo actual en minutos desde medianoche', () => {
      const now = new Date()
      const expectedMinutes = now.getHours() * 60 + now.getMinutes()
      const actualMinutes = getCurrentMinutes()
      
      // Permitir diferencia de 1 minuto por el tiempo de ejecución
      expect(Math.abs(actualMinutes - expectedMinutes)).toBeLessThanOrEqual(1)
    })
  })
})

