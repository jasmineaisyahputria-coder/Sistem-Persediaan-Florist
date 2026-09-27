// =====================================================
// SISTEM PERSEDIAAN FLORIST
// JAVASCRIPT + SUPABASE
// =====================================================


// =====================================================
// 1. KONFIGURASI SUPABASE
// =====================================================

// GANTI DENGAN DATA SUPABASE KAMU
const SUPABASE_URL =
    "https://qviongpryznpbelpziud.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2aW9uZ3ByeXpucGJlbHB6aXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MjczMjMsImV4cCI6MjEwNjEwMzMyM30.dk-G9oSo8JstPRo1-NjrxG-IJKR6p7dfOJ4HIlQBnEI";


const { createClient } =
    supabase;


const db =
    createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    );


// =====================================================
// 2. FORMAT RUPIAH
// =====================================================

function formatRupiah(value) {

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(value || 0);

}


// =====================================================
// 3. FORMAT TANGGAL
// =====================================================

function formatTanggal(tanggal) {

    if (!tanggal) return "-";

    return new Date(tanggal).toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


// =====================================================
// 4. NAVIGASI HALAMAN
// =====================================================

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active-page");

        });


    document
        .getElementById(pageId)
        .classList.add("active-page");


    document
        .querySelectorAll(".menu-item")
        .forEach(button => {

            button.classList.remove("active");

        });


    const menuButtons =
        document.querySelectorAll(".menu-item");


    menuButtons.forEach(button => {

        if (
            button
                .getAttribute("onclick")
                ?.includes(pageId)
        ) {

            button.classList.add("active");

        }

    });


    if (pageId === "dashboard") {

        loadDashboard();

    }


    if (pageId === "produk") {

        loadProduk();

    }


    if (pageId === "supplier") {

        loadSupplier();

    }


    if (pageId === "transaksi") {

        loadTransaksi();

    }


    if (pageId === "laporan") {

        loadLaporan();

    }

}


// =====================================================
// 5. MODAL
// =====================================================

function openModal(id) {

    document
        .getElementById(id)
        .classList.add("show");

}


function closeModal(id) {

    document
        .getElementById(id)
        .classList.remove("show");

}


// =====================================================
// 6. PRODUK
// =====================================================

async function loadProduk() {

    const search =
        document
            .getElementById("searchProduk")
            ?.value
            .toLowerCase() || "";


    let query =
        db
            .from("produk")
            .select(`
                *,
                supplier (
                    nama_supplier
                )
            `)
            .order(
                "produk_id",
                {
                    ascending: false
                }
            );


    if (search) {

        query =
            query.ilike(
                "nama_produk",
                `%${search}%`
            );

    }


    const { data, error } =
        await query;


    if (error) {

        console.error(error);

        alert(
            "Gagal mengambil data produk."
        );

        return;

    }


    const table =
        document.getElementById(
            "produkTable"
        );


    if (!table) return;


    table.innerHTML = "";


    if (!data || data.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="8"
                    class="empty">
                    Belum ada data produk.
                </td>
            </tr>
        `;

        return;

    }


    data.forEach((produk, index) => {

        const stokClass =
            produk.stok <= produk.stok_minimum
                ? "badge badge-low"
                : "badge badge-stock";


        table.innerHTML += `

            <tr>

                <td>
                    ${index + 1}
                </td>

                <td>
                    <strong>
                        ${produk.nama_produk}
                    </strong>
                </td>

                <td>
                    ${produk.kategori}
                </td>

                <td>
                    ${produk.satuan}
                </td>

                <td>
                    ${formatRupiah(produk.harga_beli)}
                </td>

                <td>
                    ${formatRupiah(produk.harga_jual)}
                </td>

                <td>

                    <span class="${stokClass}">
                        ${produk.stok}
                    </span>

                </td>

                <td>

                    <button
                        class="action-btn edit-btn"
                        onclick="editProduk(${produk.produk_id})">

                        ✏️

                    </button>


                    <button
                        class="action-btn delete-btn"
                        onclick="deleteProduk(${produk.produk_id})">

                        🗑️

                    </button>

                </td>

            </tr>

        `;

    });

}


// =====================================================
// 7. BUKA MODAL PRODUK
// =====================================================

async function openProdukModal() {

    document
        .getElementById("produkForm")
        .reset();


    document
        .getElementById("produkId")
        .value = "";


    document
        .getElementById("produkModalTitle")
        .textContent = "Tambah Produk";


    await loadSupplierOptions();


    openModal("produkModal");

}


// =====================================================
// 8. SUPPLIER OPTIONS
// =====================================================

async function loadSupplierOptions() {

    const { data, error } =
        await db
            .from("supplier")
            .select("*")
            .order(
                "nama_supplier",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        return;

    }


    const select =
        document.getElementById(
            "supplierProduk"
        );


    select.innerHTML =
        `<option value="">
            Pilih supplier
        </option>`;


    data.forEach(supplier => {

        select.innerHTML += `

            <option value="${supplier.supplier_id}">
                ${supplier.nama_supplier}
            </option>

        `;

    });

}


// =====================================================
// 9. SIMPAN PRODUK
// =====================================================

async function saveProduk(event) {

    event.preventDefault();


    const id =
        document
            .getElementById("produkId")
            .value;


    const produkData = {

        nama_produk:
            document
                .getElementById("namaProduk")
                .value,

        kategori:
            document
                .getElementById("kategoriProduk")
                .value,

        satuan:
            document
                .getElementById("satuanProduk")
                .value,

        supplier_id:
            document
                .getElementById("supplierProduk")
                .value
                ? Number(
                    document
                        .getElementById("supplierProduk")
                        .value
                  )
                : null,

        harga_beli:
            Number(
                document
                    .getElementById("hargaBeli")
                    .value
            ),

        harga_jual:
            Number(
                document
                    .getElementById("hargaJual")
                    .value
            ),

        stok:
            Number(
                document
                    .getElementById("stokProduk")
                    .value
            ),

        stok_minimum:
            Number(
                document
                    .getElementById("stokMinimum")
                    .value
            )

    };


    let result;


    if (id) {

        result =
            await db
                .from("produk")
                .update(produkData)
                .eq(
                    "produk_id",
                    id
                );

    } else {

        result =
            await db
                .from("produk")
                .insert(
                    produkData
                );

    }


    if (result.error) {

        console.error(result.error);

        alert(
            "Gagal menyimpan produk."
        );

        return;

    }


    alert(
        "Produk berhasil disimpan!"
    );


    closeModal("produkModal");

    loadProduk();

    loadDashboard();

    loadLaporan();

}


// =====================================================
// 10. EDIT PRODUK
// =====================================================

async function editProduk(id) {

    const { data, error } =
        await db
            .from("produk")
            .select("*")
            .eq(
                "produk_id",
                id
            )
            .single();


    if (error) {

        alert(
            "Data produk tidak ditemukan."
        );

        return;

    }


    await loadSupplierOptions();


    document
        .getElementById("produkId")
        .value =
        data.produk_id;


    document
        .getElementById("namaProduk")
        .value =
        data.nama_produk;


    document
        .getElementById("kategoriProduk")
        .value =
        data.kategori;


    document
        .getElementById("satuanProduk")
        .value =
        data.satuan;


    document
        .getElementById("supplierProduk")
        .value =
        data.supplier_id || "";


    document
        .getElementById("hargaBeli")
        .value =
        data.harga_beli;


    document
        .getElementById("hargaJual")
        .value =
        data.harga_jual;


    document
        .getElementById("stokProduk")
        .value =
        data.stok;


    document
        .getElementById("stokMinimum")
        .value =
        data.stok_minimum;


    document
        .getElementById("produkModalTitle")
        .textContent =
        "Edit Produk";


    openModal("produkModal");

}


// =====================================================
// 11. HAPUS PRODUK
// =====================================================

async function deleteProduk(id) {

    const yakin =
        confirm(
            "Yakin ingin menghapus produk ini?"
        );


    if (!yakin) return;


    const { error } =
        await db
            .from("produk")
            .delete()
            .eq(
                "produk_id",
                id
            );


    if (error) {

        console.error(error);

        alert(
            "Produk tidak dapat dihapus. Pastikan produk belum digunakan dalam transaksi."
        );

        return;

    }


    alert(
        "Produk berhasil dihapus."
    );


    loadProduk();

    loadDashboard();

    loadLaporan();

}


// =====================================================
// 12. SUPPLIER
// =====================================================

async function loadSupplier() {

    const search =
        document
            .getElementById("searchSupplier")
            ?.value
            .toLowerCase() || "";


    let query =
        db
            .from("supplier")
            .select("*")
            .order(
                "supplier_id",
                {
                    ascending: false
                }
            );


    if (search) {

        query =
            query.ilike(
                "nama_supplier",
                `%${search}%`
            );

    }


    const { data, error } =
        await query;


    if (error) {

        console.error(error);

        return;

    }


    const table =
        document.getElementById(
            "supplierTable"
        );


    if (!table) return;


    table.innerHTML = "";


    if (!data || data.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5"
                    class="empty">
                    Belum ada supplier.
                </td>
            </tr>
        `;

        return;

    }


    data.forEach((supplier, index) => {

        table.innerHTML += `

            <tr>

                <td>
                    ${index + 1}
                </td>

                <td>
                    <strong>
                        ${supplier.nama_supplier}
                    </strong>
                </td>

                <td>
                    ${supplier.telepon || "-"}
                </td>

                <td>
                    ${supplier.alamat || "-"}
                </td>

                <td>

                    <button
                        class="action-btn edit-btn"
                        onclick="editSupplier(${supplier.supplier_id})">

                        ✏️

                    </button>


                    <button
                        class="action-btn delete-btn"
                        onclick="deleteSupplier(${supplier.supplier_id})">

                        🗑️

                    </button>

                </td>

            </tr>

        `;

    });

}


// =====================================================
// 13. BUKA MODAL SUPPLIER
// =====================================================

function openSupplierModal() {

    document
        .getElementById("supplierForm")
        .reset();


    document
        .getElementById("supplierId")
        .value = "";


    document
        .getElementById("supplierModalTitle")
        .textContent =
        "Tambah Supplier";


    openModal("supplierModal");

}


// =====================================================
// 14. SIMPAN SUPPLIER
// =====================================================

async function saveSupplier(event) {

    event.preventDefault();


    const id =
        document
            .getElementById("supplierId")
            .value;


    const data = {

        nama_supplier:
            document
                .getElementById("namaSupplier")
                .value,

        telepon:
            document
                .getElementById("teleponSupplier")
                .value,

        alamat:
            document
                .getElementById("alamatSupplier")
                .value

    };


    let result;


    if (id) {

        result =
            await db
                .from("supplier")
                .update(data)
                .eq(
                    "supplier_id",
                    id
                );

    } else {

        result =
            await db
                .from("supplier")
                .insert(data);

    }


    if (result.error) {

        console.error(result.error);

        alert(
            "Gagal menyimpan supplier."
        );

        return;

    }


    alert(
        "Supplier berhasil disimpan!"
    );


    closeModal("supplierModal");

    loadSupplier();

    loadProduk();

}


// =====================================================
// 15. EDIT SUPPLIER
// =====================================================

async function editSupplier(id) {

    const { data, error } =
        await db
            .from("supplier")
            .select("*")
            .eq(
                "supplier_id",
                id
            )
            .single();


    if (error) {

        alert(
            "Data supplier tidak ditemukan."
        );

        return;

    }


    document
        .getElementById("supplierId")
        .value =
        data.supplier_id;


    document
        .getElementById("namaSupplier")
        .value =
        data.nama_supplier;


    document
        .getElementById("teleponSupplier")
        .value =
        data.telepon || "";


    document
        .getElementById("alamatSupplier")
        .value =
        data.alamat || "";


    document
        .getElementById("supplierModalTitle")
        .textContent =
        "Edit Supplier";


    openModal("supplierModal");

}


// =====================================================
// 16. HAPUS SUPPLIER
// =====================================================

async function deleteSupplier(id) {

    const yakin =
        confirm(
            "Yakin ingin menghapus supplier ini?"
        );


    if (!yakin) return;


    const { error } =
        await db
            .from("supplier")
            .delete()
            .eq(
                "supplier_id",
                id
            );


    if (error) {

        alert(
            "Supplier tidak dapat dihapus karena masih digunakan oleh produk."
        );

        return;

    }


    alert(
        "Supplier berhasil dihapus."
    );


    loadSupplier();

}


// =====================================================
// 17. TRANSAKSI
// =====================================================

async function loadTransaksi() {

    const search =
        document
            .getElementById("searchTransaksi")
            ?.value
            .toLowerCase() || "";


    let query =
        db
            .from("transaksi")
            .select("*")
            .order(
                "transaksi_id",
                {
                    ascending: false
                }
            );


    if (search) {

        query =
            query.ilike(
                "nomor_transaksi",
                `%${search}%`
            );

    }


    const { data, error } =
        await query;


    if (error) {

        console.error(error);

        return;

    }


    const table =
        document.getElementById(
            "transaksiTable"
        );


    table.innerHTML = "";


    if (!data || data.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7"
                    class="empty">
                    Belum ada transaksi.
                </td>
            </tr>
        `;

        return;

    }


    data.forEach((trx, index) => {

        const badge =
            trx.jenis_transaksi === "MASUK"
                ? "badge badge-masuk"
                : "badge badge-keluar";


        table.innerHTML += `

            <tr>

                <td>
                    ${index + 1}
                </td>

                <td>
                    <strong>
                        ${trx.nomor_transaksi}
                    </strong>
                </td>

                <td>
                    ${formatTanggal(trx.tanggal)}
                </td>

                <td>

                    <span class="${badge}">
                        ${trx.jenis_transaksi}
                    </span>

                </td>

                <td>
                    ${formatRupiah(trx.total)}
                </td>

                <td>
                    ${trx.keterangan || "-"}
                </td>

                <td>

                    <button
                        class="action-btn delete-btn"
                        onclick="deleteTransaksi(${trx.transaksi_id})">

                        🗑️

                    </button>

                </td>

            </tr>

        `;

    });

}


// =====================================================
// 18. BUKA MODAL TRANSAKSI
// =====================================================

async function openTransaksiModal() {

    await loadProdukOptions();


    document
        .getElementById("tanggalTransaksi")
        .value =
        new Date()
            .toISOString()
            .split("T")[0];


    document
        .getElementById("jumlahTransaksi")
        .value = "";


    document
        .getElementById("hargaTransaksi")
        .value = "";


    document
        .getElementById("keteranganTransaksi")
        .value = "";


    document
        .getElementById("totalTransaksiPreview")
        .textContent =
        "Rp0";


    openModal("transaksiModal");

}


// =====================================================
// 19. PRODUK OPTIONS
// =====================================================

async function loadProdukOptions() {

    const { data, error } =
        await db
            .from("produk")
            .select("*")
            .order(
                "nama_produk",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        return;

    }


    const select =
        document.getElementById(
            "produkTransaksi"
        );


    select.innerHTML =
        `<option value="">
            Pilih produk
        </option>`;


    data.forEach(produk => {

        select.innerHTML += `

            <option
                value="${produk.produk_id}"
                data-harga-beli="${produk.harga_beli}"
                data-harga-jual="${produk.harga_jual}">

                ${produk.nama_produk}
                - Stok: ${produk.stok}

            </option>

        `;

    });

}


// =====================================================
// 20. AUTO HARGA TRANSAKSI
// =====================================================

document
    .getElementById("produkTransaksi")
    ?.addEventListener(
        "change",
        function () {

            const option =
                this.options[
                    this.selectedIndex
                ];


            const jenis =
                document
                    .getElementById(
                        "jenisTransaksi"
                    )
                    .value;


            if (!option) return;


            const hargaBeli =
                option
                    .dataset
                    .hargaBeli;


            const hargaJual =
                option
                    .dataset
                    .hargaJual;


            document
                .getElementById(
                    "hargaTransaksi"
                )
                .value =
                jenis === "MASUK"
                    ? hargaBeli
                    : hargaJual;


            hitungTotal();

        }
    );


// =====================================================
// 21. JENIS TRANSAKSI BERUBAH
// =====================================================

document
    .getElementById("jenisTransaksi")
    ?.addEventListener(
        "change",
        async function () {

            const option =
                document
                    .getElementById(
                        "produkTransaksi"
                    )
                    .options[
                        document
                            .getElementById(
                                "produkTransaksi"
                            )
                            .selectedIndex
                    ];


            if (!option) return;


            document
                .getElementById(
                    "hargaTransaksi"
                )
                .value =
                this.value === "MASUK"
                    ? option.dataset.hargaBeli
                    : option.dataset.hargaJual;


            hitungTotal();

        }
    );


// =====================================================
// 22. HITUNG TOTAL
// =====================================================

document
    .getElementById("jumlahTransaksi")
    ?.addEventListener(
        "input",
        hitungTotal
    );


document
    .getElementById("hargaTransaksi")
    ?.addEventListener(
        "input",
        hitungTotal
    );


function hitungTotal() {

    const jumlah =
        Number(
            document
                .getElementById(
                    "jumlahTransaksi"
                )
                .value
        ) || 0;


    const harga =
        Number(
            document
                .getElementById(
                    "hargaTransaksi"
                )
                .value
        ) || 0;


    const total =
        jumlah * harga;


    document
        .getElementById(
            "totalTransaksiPreview"
        )
        .textContent =
        formatRupiah(total);

}


// =====================================================
// 23. SIMPAN TRANSAKSI
// =====================================================

async function saveTransaksi(event) {

    event.preventDefault();


    const jenis =
        document
            .getElementById(
                "jenisTransaksi"
            )
            .value;


    const tanggal =
        document
            .getElementById(
                "tanggalTransaksi"
            )
            .value;


    const produkId =
        Number(
            document
                .getElementById(
                    "produkTransaksi"
                )
                .value
        );


    const jumlah =
        Number(
            document
                .getElementById(
                    "jumlahTransaksi"
                )
                .value
        );


    const harga =
        Number(
            document
                .getElementById(
                    "hargaTransaksi"
                )
                .value
        );


    const keterangan =
        document
            .getElementById(
                "keteranganTransaksi"
            )
            .value;


    if (!produkId) {

        alert(
            "Pilih produk terlebih dahulu."
        );

        return;

    }


    // Ambil produk

    const {
        data: produk,
        error: produkError
    } =
        await db
            .from("produk")
            .select("*")
            .eq(
                "produk_id",
                produkId
            )
            .single();


    if (produkError) {

        alert(
            "Produk tidak ditemukan."
        );

        return;

    }


    // Cek stok untuk transaksi keluar

    if (
        jenis === "KELUAR" &&
        jumlah > produk.stok
    ) {

        alert(
            `Stok ${produk.nama_produk} hanya ${produk.stok}.`
        );

        return;

    }


    const total =
        jumlah * harga;


    // Membuat nomor transaksi

    const nomor =
        "TRX-" +
        Date.now();


    // Simpan transaksi

    const {
        data: transaksi,
        error: transaksiError
    } =
        await db
            .from("transaksi")
            .insert({

                nomor_transaksi:
                    nomor,

                tanggal:
                    tanggal,

                jenis_transaksi:
                    jenis,

                total:
                    total,

                keterangan:
                    keterangan

            })
            .select()
            .single();


    if (transaksiError) {

        console.error(
            transaksiError
        );

        alert(
            "Gagal menyimpan transaksi."
        );

        return;

    }


    // Simpan detail

    const {
        error: detailError
    } =
        await db
            .from("detail_transaksi")
            .insert({

                transaksi_id:
                    transaksi.transaksi_id,

                produk_id:
                    produkId,

                jumlah:
                    jumlah,

                harga:
                    harga

            });


    if (detailError) {

        console.error(
            detailError
        );


        // Hapus transaksi jika detail gagal

        await db
            .from("transaksi")
            .delete()
            .eq(
                "transaksi_id",
                transaksi.transaksi_id
            );


        alert(
            "Detail transaksi gagal disimpan."
        );

        return;

    }


    // Hitung stok baru

    let stokBaru;


    if (jenis === "MASUK") {

        stokBaru =
            produk.stok + jumlah;

    } else {

        stokBaru =
            produk.stok - jumlah;

    }


    // Update stok

    const {
        error: stokError
    } =
        await db
            .from("produk")
            .update({

                stok:
                    stokBaru

            })
            .eq(
                "produk_id",
                produkId
            );


    if (stokError) {

        console.error(
            stokError
        );

        alert(
            "Transaksi tersimpan tetapi stok gagal diperbarui."
        );

        return;

    }


    alert(
        `Transaksi ${nomor} berhasil disimpan!`
    );


    closeModal(
        "transaksiModal"
    );


    loadTransaksi();

    loadProduk();

    loadDashboard();

    loadLaporan();

}


// =====================================================
// 24. HAPUS TRANSAKSI
// =====================================================

async function deleteTransaksi(id) {

    const yakin =
        confirm(
            "Yakin ingin menghapus transaksi ini? Stok akan dikembalikan."
        );


    if (!yakin) return;


    // Ambil transaksi

    const {
        data: transaksi,
        error: transaksiError
    } =
        await db
            .from("transaksi")
            .select("*")
            .eq(
                "transaksi_id",
                id
            )
            .single();


    if (transaksiError) {

        alert(
            "Transaksi tidak ditemukan."
        );

        return;

    }


    // Ambil detail

    const {
        data: details,
        error: detailError
    } =
        await db
            .from("detail_transaksi")
            .select("*")
            .eq(
                "transaksi_id",
                id
            );


    if (detailError) {

        alert(
            "Detail transaksi gagal diambil."
        );

        return;

    }


    // Kembalikan stok

    for (const detail of details) {

        const {
            data: produk,
            error
        } =
            await db
                .from("produk")
                .select("stok")
                .eq(
                    "produk_id",
                    detail.produk_id
                )
                .single();


        if (error) continue;


        let stokBaru;


        if (
            transaksi.jenis_transaksi
            === "MASUK"
        ) {

            stokBaru =
                produk.stok -
                detail.jumlah;

        } else {

            stokBaru =
                produk.stok +
                detail.jumlah;

        }


        await db
            .from("produk")
            .update({

                stok:
                    stokBaru

            })
            .eq(
                "produk_id",
                detail.produk_id
            );

    }


    // Hapus transaksi

    const { error: deleteError } =
        await db
            .from("transaksi")
            .delete()
            .eq(
                "transaksi_id",
                id
            );


    if (deleteError) {

        alert(
            "Transaksi gagal dihapus."
        );

        return;

    }


    alert(
        "Transaksi berhasil dihapus dan stok dikembalikan."
    );


    loadTransaksi();

    loadProduk();

    loadDashboard();

    loadLaporan();

}


// =====================================================
// 25. DASHBOARD
// =====================================================

function showDashboardError(message) {
    const status = document.getElementById("databaseStatus");
    status.textContent = `Data Supabase gagal dimuat: ${message}`;
    status.hidden = false;

    ["totalProduk", "totalSupplier", "totalStok", "totalTransaksi"]
        .forEach(id => {
            document.getElementById(id).textContent = "—";
        });
}


async function loadDashboard() {

    const status = document.getElementById("databaseStatus");
    status.hidden = true;

    ["totalProduk", "totalSupplier", "totalStok", "totalTransaksi"]
        .forEach(id => {
            document.getElementById(id).textContent = "…";
        });

    const [
        produkResult,
        supplierResult,
        transaksiResult
    ] =
        await Promise.all([

            db
                .from("produk")
                .select(
                    "produk_id, stok"
                ),

            db
                .from("supplier")
                .select(
                    "supplier_id"
                ),

            db
                .from("transaksi")
                .select(
                    "transaksi_id"
                )

        ]);


    const requestError = [
        produkResult.error,
        supplierResult.error,
        transaksiResult.error
    ].find(Boolean);

    if (requestError) {
        showDashboardError(requestError.message || "Periksa koneksi dan kebijakan database.");
        return;
    }


    const totalProduk =
        produkResult.data?.length || 0;


    const totalSupplier =
        supplierResult.data?.length || 0;


    const totalTransaksi =
        transaksiResult.data?.length || 0;


    const totalStok =
        produkResult.data
            ?.reduce(
                (total, produk) =>
                    total + Number(produk.stok),
                0
            ) || 0;


    document
        .getElementById(
            "totalProduk"
        )
        .textContent =
        totalProduk;


    document
        .getElementById(
            "totalSupplier"
        )
        .textContent =
        totalSupplier;


    document
        .getElementById(
            "totalTransaksi"
        )
        .textContent =
        totalTransaksi;


    document
        .getElementById(
            "totalStok"
        )
        .textContent =
        totalStok;


    // Produk terbaru

    const {
        data: produk,
        error: produkError
    } =
        await db
            .from("produk")
            .select("*")
            .order(
                "produk_id",
                {
                    ascending: false
                }
            )
            .limit(5);

    if (produkError) {
        showDashboardError(produkError.message);
        return;
    }


    const table =
        document.getElementById(
            "dashboardProduk"
        );


    table.innerHTML = "";


    produk?.forEach(item => {

        table.innerHTML += `

            <tr>

                <td>
                    ${item.nama_produk}
                </td>

                <td>
                    ${item.kategori}
                </td>

                <td>
                    ${item.stok}
                    ${item.satuan}
                </td>

                <td>
                    ${formatRupiah(item.harga_beli)}
                </td>

            </tr>

        `;

    });


    // Stok rendah

    const {
        data: stokRendah,
        error: stokError
    } =
        await db
            .from("produk")
            .select("*")
            .order(
                "stok",
                {
                    ascending: true
                }
            );

    if (stokError) {
        showDashboardError(stokError.message);
        return;
    }


    const lowStock =
        document.getElementById(
            "stokRendah"
        );


    lowStock.innerHTML = "";


    const produkLow =
        stokRendah
            ?.filter(
                item =>
                    item.stok <=
                    item.stok_minimum
            )
            .slice(0, 5);


    if (
        !produkLow ||
        produkLow.length === 0
    ) {

        lowStock.innerHTML = `

            <div class="empty">
                Semua stok masih aman 🌷
            </div>

        `;

    } else {

        produkLow.forEach(item => {

            lowStock.innerHTML += `

                <div class="low-stock-item">

                    <div>

                        <strong>
                            ${item.nama_produk}
                        </strong>

                        <span>
                            Stok minimum:
                            ${item.stok_minimum}
                        </span>

                    </div>

                    <span>
                        Stok:
                        ${item.stok}
                    </span>

                </div>

            `;

        });

    }

}


// =====================================================
// 26. LAPORAN
// =====================================================

async function loadLaporan() {

    const {
        data,
        error
    } =
        await db
            .from("produk")
            .select("*")
            .order(
                "nama_produk",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        return;

    }


    const table =
        document.getElementById(
            "laporanTable"
        );


    table.innerHTML = "";


    let totalNilai = 0;


    data.forEach(
        (produk, index) => {

            const nilai =
                Number(
                    produk.stok
                ) *
                Number(
                    produk.harga_beli
                );


            totalNilai += nilai;


            table.innerHTML += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        <strong>
                            ${produk.nama_produk}
                        </strong>
                    </td>

                    <td>
                        ${produk.kategori}
                    </td>

                    <td>
                        ${produk.stok}
                        ${produk.satuan}
                    </td>

                    <td>
                        ${formatRupiah(
                            produk.harga_beli
                        )}
                    </td>

                    <td>
                        ${formatRupiah(
                            nilai
                        )}
                    </td>

                </tr>

            `;

        }
    );


    document
        .getElementById(
            "nilaiPersediaan"
        )
        .textContent =
        formatRupiah(
            totalNilai
        );

}


// =====================================================
// 27. LOAD AWAL
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDashboard();

    }
);