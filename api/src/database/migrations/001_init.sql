-- Tabelas do módulo de manutenção preventiva, no schema "manutencao" (separado do "public" do hub).
-- public.users e public.branchs são do hub: aqui só apontamos para elas, nunca alteramos.

CREATE SCHEMA IF NOT EXISTS manutencao;

-- O que recebe manutenção (PC, teclado...) e quando é a próxima.
CREATE TABLE manutencao.equipment (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    branch_id INT REFERENCES public.branchs(id) ON DELETE SET NULL,
    location TEXT,
    interval_days INT NOT NULL CHECK (interval_days > 0),
    next_date DATE NOT NULL,
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cada manutenção confirmada. scheduled_date guarda a data que estava prevista, para saber se atrasou.
CREATE TABLE manutencao.maintenance (
    id SERIAL PRIMARY KEY,
    equipment_id INT NOT NULL REFERENCES manutencao.equipment(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    done_date DATE NOT NULL,
    notes TEXT,
    done_by INT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX maintenance_equipment_idx ON manutencao.maintenance (equipment_id, done_date DESC);

-- Fotos de cada manutenção. O arquivo fica em disco (pasta uploads); aqui vai só o nome dele.
CREATE TABLE manutencao.maintenance_photo (
    id SERIAL PRIMARY KEY,
    maintenance_id INT NOT NULL REFERENCES manutencao.maintenance(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
