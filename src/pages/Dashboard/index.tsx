import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FiPower, FiClock } from 'react-icons/fi';
import DayPicker, { DayModifiers } from 'react-day-picker';
import { isToday, format, parseISO, isAfter } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';
import 'react-day-picker/lib/style.css';

import logo from '../../assets/images/logo.svg';
import { useAuth } from '../../hooks/Auth';
import api from '../../services/api';

import {
  Container,
  HeaderBackground,
  HeaderContent,
  Profile,
  Content,
  Schedule,
  Calendar,
  NextAppointment,
  Section,
  Appointment,
} from './styles';

interface MonthAvailabilityItem {
  dia: number;
  disponivel: boolean;
}

interface Appointment {
  id: string;
  data: string;
  horaFormatada: string;
  usuario: {
    nome: string;
    avatar_url: string;
  };
}

const Dashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [monthAvailability, setMonthAvailability] = useState<
    MonthAvailabilityItem[]
  >([]);

  const { signOut, usuario } = useAuth();

  const handleDateChange = useCallback((day: Date, modifiers: DayModifiers) => {
    if (modifiers.available && !modifiers.disabled) {
      setSelectedDate(day);
    }
  }, []);

  const handleMonthChange = useCallback((month: Date) => {
    setCurrentMonth(month);
  }, []);

  useEffect(() => {
    api
      .get(`/prestadores/${usuario.id}/mes-disponibilidade`, {
        params: {
          mes: currentMonth.getMonth() + 1,
          ano: currentMonth.getFullYear(),
        },
      })
      .then(response => {
        setMonthAvailability(response.data);
      });
  }, [currentMonth, usuario.id]);

  useEffect(() => {
    api
      .get<Appointment[]>(`/agendamentos/meus-agendamentos`, {
        params: {
          dia: selectedDate.getDate(),
          mes: selectedDate.getMonth() + 1,
          ano: selectedDate.getFullYear(),
        },
      })
      .then(response => {
        const appointmentsFormatted = response.data.map(appointment => {
          return {
            ...appointment,
            horaFormatada: format(parseISO(appointment.data), 'HH:mm'),
          };
        });
        setAppointments(appointmentsFormatted);
      });
  }, [selectedDate]);

  const disabledDays = useMemo(() => {
    const dates = monthAvailability
      .filter(monthDay => monthDay.disponivel === false)
      .map(monthDay => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        return new Date(year, month, monthDay.dia);
      });

    return dates;
  }, [currentMonth, monthAvailability]);

  const selectedDateAsText = useMemo(() => {
    return format(selectedDate, "'Dia' dd 'de' MMM", {
      locale: pt,
    });
  }, [selectedDate]);

  const selectedWeekDay = useMemo(() => {
    return format(selectedDate, 'cccc', {
      locale: pt,
    });
  }, [selectedDate]);

  const morningAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      return parseISO(appointment.data).getHours() < 12;
    });
  }, [appointments]);

  const afternoonAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      return parseISO(appointment.data).getHours() >= 12;
    });
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    return appointments.find(appointment =>
      isAfter(parseISO(appointment.data), new Date()),
    );
  }, [appointments]);

  return (
    <Container>
      <HeaderBackground>
        <HeaderContent>
          <img src={logo} alt="GoBarber" />

          <Profile>
            <img src={usuario.avatar_url} alt={usuario.nome} />

            <div>
              <span>Bem-vindo</span>
              <strong>{usuario.nome}</strong>
            </div>
          </Profile>

          <button type="submit" onClick={signOut}>
            <FiPower />
          </button>
        </HeaderContent>
      </HeaderBackground>

      <Content>
        <Schedule>
          <h1>Horários agendados</h1>
          <p>
            {isToday(selectedDate) && <span> Hoje</span>}
            <span>{selectedDateAsText}</span>
            <span>{selectedWeekDay}</span>
          </p>

          {isToday(selectedDate) && nextAppointment && (
            <NextAppointment>
              <strong>Agendamento a seguir</strong>

              <div>
                <img
                  src={nextAppointment.usuario.avatar_url}
                  alt={nextAppointment.usuario.nome}
                />

                <strong>{nextAppointment.usuario.nome}</strong>
                <span>
                  <FiClock />
                  {nextAppointment.horaFormatada}
                </span>
              </div>
            </NextAppointment>
          )}

          <Section>
            <strong>Manhã</strong>

            {morningAppointments.length === 0 && (
              <p>Nenhum Agendamento neste período</p>
            )}

            {morningAppointments.map(appointment => (
              <Appointment key={appointment.id}>
                <span>
                  <FiClock />
                  {appointment.horaFormatada}
                </span>

                <div>
                  <img
                    src={appointment.usuario.avatar_url}
                    alt={appointment.usuario.nome}
                  />

                  <strong>{appointment.usuario.nome}</strong>
                </div>
              </Appointment>
            ))}
          </Section>

          <Section>
            <strong>Tarde</strong>

            {afternoonAppointments.length === 0 && (
              <p>Nenhum Agendamento neste período</p>
            )}

            {afternoonAppointments.map(appointment => (
              <Appointment key={appointment.id}>
                <span>
                  <FiClock />
                  {appointment.horaFormatada}
                </span>

                <div>
                  <img
                    src={appointment.usuario.avatar_url}
                    alt={appointment.usuario.nome}
                  />

                  <strong>{appointment.usuario.nome}</strong>
                </div>
              </Appointment>
            ))}
          </Section>
        </Schedule>

        <Calendar>
          <DayPicker
            weekdaysShort={['D', 'S', 'T', 'Q', 'Q', 'S', 'S']}
            fromMonth={new Date()}
            disabledDays={[
              {
                daysOfWeek: [0, 6],
              },
              ...disabledDays,
            ]}
            modifiers={{
              available: { daysOfWeek: [1, 2, 3, 4, 5, 6] },
            }}
            selectedDays={selectedDate}
            onDayClick={handleDateChange}
            onMonthChange={handleMonthChange}
            months={[
              'Janeiro',
              'Fevereiro',
              'Março',
              'Abril',
              'Maio',
              'Junho',
              'Julho',
              'Agosto',
              'Setembro',
              'Outubro',
              'Novembro',
              'Dezembro',
            ]}
          />
        </Calendar>
      </Content>
    </Container>
  );
};

export default Dashboard;
