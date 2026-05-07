import React, { useState } from 'react'
import { apiFetch } from '../../../../services/apiClient'
import { RECEPTIONIST_PATIENT_REGISTER } from '../../../../config/api'

const INITIAL_FORM_DATA = {
    firstName: '',
    lastName: '',
    gender: '',
    dob: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContact: '',
    bloodGroup: '',
    bloodGroupValue: "",
    medicalHistory: '',
    pincode: '',
    city: '',
    state: '',
    country: '',
    district: '',
    idType: '',
    idNumber: '',
    idName: '',
}

const PatientRegistration = () => {
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState(INITIAL_FORM_DATA)

    // Auto-fill address based on Pincode
    React.useEffect(() => {
        const fetchLocation = async () => {
            if (formData.pincode.length === 6) {
                try {
                    const res = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`)
                    const data = await res.json()
                    if (data[0].Status === 'Success') {
                        const postOffice = data[0].PostOffice[0]
                        setFormData(prev => ({
                            ...prev,
                            city: postOffice.Division,
                            district: postOffice.District,
                            state: postOffice.State,
                            country: 'India'
                        }))
                    }
                } catch (error) {
                    console.error('Error fetching pincode data:', error)
                }
            }
        }
        fetchLocation()
    }, [formData.pincode])

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setSubmitting(true)

            // Build the payload to send to the backend
            const payload = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                gender: formData.gender,
                date_of_birth: formData.dob,
                phone: formData.phone,
                email: formData.email,
                password: formData.password,
                address: formData.address,
                pincode: formData.pincode,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                district: formData.district,
                id_type: formData.idType,
                id_number: formData.idNumber,
                id_name: formData.idType === 'Other' ? formData.idName : '',
                emergency_contact: {
                    name: formData.emergencyContactName,
                    relationship: formData.emergencyContactRelationship,
                    phone: formData.emergencyContact,
                },
                blood_group: formData.bloodGroup === 'other'
                    ? (formData.bloodGroupValue || '')
                    : formData.bloodGroup,
                medical_history: formData.medicalHistory,
            }



            const res = await apiFetch(RECEPTIONIST_PATIENT_REGISTER, {
                method: 'POST',
                body: payload,
            })
            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                throw new Error(data.message || data.error || 'Registration failed')
            }

            alert(data.message || 'Patient registered successfully!')
            setFormData(INITIAL_FORM_DATA)

        } catch (error) {
            console.error('Patient registration error:', error)
            alert(error.message || "Something went wrong during registration")
        } finally {
            setSubmitting(false)
        }
    }

    const handleClear = () => {
        setFormData(INITIAL_FORM_DATA)
    }


    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6"> Patient Registration</h2>

            <div className="bg-white rounded-xl card-shadow border p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                />
                            </div>
                            {/* <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Age <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                />
                            </div> */}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Id Type <span className="text-red-500">*</span></label>
                                <select
                                    name="idType"
                                    value={formData.idType}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                >
                                    <option value="">Select Id Type</option>
                                    <option value="Aadhaar Card">Aadhaar Card</option>
                                    <option value="Passport">Passport</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {formData.idType === 'Aadhaar Card' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="idNumber"
                                        value={formData.idNumber}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                                            setFormData({ ...formData, idNumber: value })
                                        }}
                                        placeholder="Enter 12-digit Aadhaar Number"
                                        className="w-full border rounded p-2"
                                        required
                                    />
                                </div>
                            )}

                            {formData.idType === 'Passport' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="idNumber"
                                        value={formData.idNumber}
                                        onChange={handleChange}
                                        placeholder="Enter Alphanumeric Passport Number"
                                        className="w-full border rounded p-2"
                                        style={{ textTransform: 'uppercase' }}
                                        required
                                    />
                                </div>
                            )}

                            {formData.idType === 'Other' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="idName"
                                            value={formData.idName}
                                            onChange={handleChange}
                                            placeholder="e.g. Voter ID, Driving License"
                                            className="w-full border rounded p-2"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Number <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="idNumber"
                                            value={formData.idNumber}
                                            onChange={handleChange}
                                            placeholder="Enter ID Number"
                                            className="w-full border rounded p-2"
                                            required
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                    placeholder="Enter valid email"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                    placeholder="Minimum 6 characters"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full border rounded p-2"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode / Zip Code</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    placeholder="Enter 6-digit Pincode"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                <input
                                    type="text"
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="emergencyContactName"
                                    value={formData.emergencyContactName}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                                <input
                                    type="text"
                                    name="emergencyContactRelationship"
                                    value={formData.emergencyContactRelationship}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    name="emergencyContact"
                                    value={formData.emergencyContact}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/*Blood Group */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Blood Group</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                            {
                                formData.bloodGroup === "other" ? (
                                    <input
                                        type="text"
                                        name="bloodGroup"
                                        value={formData.bloodGroupValue || ""}
                                        onChange={(e) => {
                                            const value = e.target.value

                                            // If input cleared → go back to dropdown
                                            if (value === "") {
                                                setFormData({
                                                    ...formData,
                                                    bloodGroup: "",
                                                    bloodGroupValue: ""
                                                })
                                            } else {
                                                setFormData({
                                                    ...formData,
                                                    bloodGroupValue: value
                                                })
                                            }
                                        }}
                                        placeholder="Enter Blood Group"
                                        className="w-full border rounded p-2"
                                    />
                                ) : (
                                    <select
                                        name="bloodGroup"
                                        value={formData.bloodGroup || ""}
                                        onChange={(e) => {
                                            const value = e.target.value

                                            setFormData({
                                                ...formData,
                                                bloodGroup: value,
                                                bloodGroupValue: ""
                                            })
                                        }}
                                        className="w-full border rounded p-2"
                                    >
                                        <option value="">Select Blood Group</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="other">Other</option>
                                    </select>
                                )
                            }
                        </div>
                    </div>
                    {/* Medical History */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Medical History</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Known Medical Conditions</label>
                            <textarea
                                name="medicalHistory"
                                value={formData.medicalHistory}
                                onChange={handleChange}
                                rows="4"
                                className="w-full border rounded p-2"
                                placeholder="List any known medical conditions, allergies, or current medications..."
                            ></textarea>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center min-w-[160px] ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 active:scale-95'
                                }`}
                        >
                            {submitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Registering...
                                </>
                            ) : (
                                'Register Patient'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-semibold transition-all active:scale-95"
                        >
                            Clear Form
                        </button>
                    </div>
                </form>
            </div>

            {/* Quick Registration Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-800 mb-2">Registration Tips</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Ensure all required fields (marked with *) are filled</li>
                    <li>• Verify phone numbers and emergency contact information</li>
                    <li>• Ask patients about insurance details if available</li>
                    <li>• Document any known medical conditions for better care</li>
                </ul>
            </div>
        </div>
    )
}

export default PatientRegistration