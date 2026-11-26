# fit_com_rpe.py ENTRADA SAIDA [RPE]  — copia um .fit acrescentando à mensagem de sessão o campo 193
# (workout_rpe, uint8, RPE×10), como fazem os relógios que perguntam o esforço no fim.
# Usado por testes/rc2.py para conferir a leitura do esforço na importação.
import struct, sys

def crc16(data, crc=0):
    tab = [0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401, 0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400]
    for b in data:
        tmp = tab[crc & 0xF]; crc = (crc >> 4) & 0x0FFF; crc = crc ^ tmp ^ tab[b & 0xF]
        tmp = tab[crc & 0xF]; crc = (crc >> 4) & 0x0FFF; crc = crc ^ tmp ^ tab[(b >> 4) & 0xF]
    return crc

def main(ent, sai, rpe=7):
    b = open(ent, 'rb').read()
    hs = b[0]; tam = struct.unpack('<I', b[4:8])[0]
    corpo = b[hs:hs+tam]; out = bytearray(); defs = {}; p = 0
    while p < len(corpo):
        h = corpo[p]
        if h & 0x80:
            d = defs[(h >> 5) & 3]; out += corpo[p:p+1+d['tam']]
            if d['sessao']: out.append(rpe*10)
            p += 1 + d['tam']; continue
        local = h & 0x0F
        if h & 0x40:
            dev = bool(h & 0x20); le = corpo[p+2] == 0
            glob = struct.unpack('<H' if le else '>H', corpo[p+3:p+5])[0]; nf = corpo[p+5]
            q = p + 6; t = 0
            for i in range(nf): t += corpo[q+1]; q += 3
            nd_bytes = b''
            if dev:
                nd = corpo[q]; nd_bytes = corpo[q:q+1+nd*3]
                for i in range(nd): t += corpo[q+1+i*3+1]
                q += 1 + nd*3
            sess = glob == 18
            if sess:
                out += corpo[p:p+5] + bytes([nf+1]) + corpo[p+6:p+6+nf*3] + bytes([193, 1, 0x02]) + nd_bytes
            else:
                out += corpo[p:q]
            defs[local] = { 'tam': t, 'sessao': sess }
            p = q; continue
        d = defs[local]; out += corpo[p:p+1+d['tam']]
        if d['sessao']: out.append(rpe*10)
        p += 1 + d['tam']
    cab = bytearray(b[:hs]); cab[4:8] = struct.pack('<I', len(out))
    if hs == 14: cab[12:14] = struct.pack('<H', crc16(cab[:12]))
    arq = bytes(cab) + bytes(out)
    arq += struct.pack('<H', crc16(arq))
    open(sai, 'wb').write(arq)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 7)
